import { useCallback, useMemo, useState, type FormEvent } from 'react';

import { toFormFieldErrors } from '@/lib/field-errors';
import {
  useCreateWalletMutation,
  useUpdateWalletMutation,
} from '@/features/wallets/hooks/use-wallet-mutations';
import { isWalletProvider } from '@/features/wallets/constants/wallets';
import { validateWalletForm } from '@/features/wallets/lib/wallet-validation';
import type { CreateWalletRequest } from '@/features/wallets/types/wallet';
import type {
  WalletFormApi,
  WalletFormErrors,
  WalletFormValues,
} from '@/features/wallets/types/wallet-state';
import type { UseWalletFormOptions } from '@/features/wallets/types/wallet-hooks';
import { joinEnsName, splitEnsName } from '@/lib/ens-name';
import { isNetworkId } from '@/constants/network';
import type { NormalizedHttpError } from '@/types/http';

/**
 * Um bloco de carteira do frame — "Carteira principal" ou "Carteira secundária".
 *
 * O mesmo hook serve aos dois porque a diferença entre eles é só o papel e o
 * verbo: bloco com carteira já cadastrada **atualiza** (`PATCH`), bloco vazio
 * **cadastra** (`POST`). Duplicar o formulário por papel faria duas cópias da
 * mesma validação, que divergiriam no primeiro campo que mudasse de regra.
 *
 * **O preenchimento é derivado, não copiado.** O estado guarda só o que foi
 * digitado; a carteira salva — e, na secundária, a semente copiada da principal
 * — entram no render por baixo. Copiar para dentro do estado exigiria um efeito
 * a cada refetch, que teria que adivinhar se sobrescreve o que já estava
 * digitado. Derivando, a regra é uma linha: **campo digitado vence a semente,
 * que vence a carteira salva**.
 *
 * **Erros só depois da primeira tentativa.** Depois de um envio recusado, a
 * validação acompanha cada tecla, e o erro sai da tela quando deixa de ser
 * verdade. Os `fieldErrors` da API caem nos mesmos campos — inclusive o `409`
 * de endereço já cadastrado, que o mapa de conflitos leva ao campo `address`.
 *
 * @param options - Papel do bloco, carteira salva, semente, dono e o aviso de
 *   conclusão (que a tela usa para anunciar e fechar o bloco).
 * @returns Valores, erros e as ações do bloco.
 */
export function useWalletForm({
  role,
  wallet,
  seed,
  userId,
  onSaved,
  onFailed,
}: UseWalletFormOptions): WalletFormApi {
  const [draft, setDraft] = useState<Partial<WalletFormValues>>({});
  const [serverErrors, setServerErrors] = useState<WalletFormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const createMutation = useCreateWalletMutation(userId);
  const updateMutation = useUpdateWalletMutation(userId);

  const values = useMemo<WalletFormValues>(() => {
    const ens = splitEnsName(wallet?.ensName ?? null);

    /**
     * Resolve um campo pela ordem digitado → semente → carteira salva.
     *
     * @param field - Campo do formulário.
     * @param saved - Valor que a carteira salva tem para ele.
     * @returns Valor a exibir no controle.
     */
    const resolve = (field: keyof WalletFormValues, saved: string): string =>
      draft[field] ?? seed?.[field] ?? saved;

    // A rede vem de um `select`, entao o valor pode nao ser uma rede conhecida
    // ate alguem escolher: `''` e o estado em que o placeholder aparece.
    const network = draft.network ?? seed?.network ?? wallet?.network ?? '';

    return {
      displayName: resolve('displayName', wallet?.displayName ?? ''),
      label: resolve('label', wallet?.label ?? ''),
      profileName: resolve('profileName', wallet?.profileName ?? ''),
      email: resolve('email', wallet?.email ?? ''),
      referralCode: resolve('referralCode', wallet?.referralCode ?? ''),
      // O endereço nunca vem da semente: duas carteiras do mesmo dono não podem
      // repeti-lo (ver `SAME_AS_PRIMARY_HINT`).
      address: draft.address ?? wallet?.address ?? '',
      linkedReference: resolve('linkedReference', wallet?.linkedReference ?? ''),
      ensLabel: draft.ensLabel ?? seed?.ensLabel ?? ens.label,
      ensDomain: draft.ensDomain ?? seed?.ensDomain ?? ens.domain,
      network: isNetworkId(network) ? network : '',
      provider: resolve('provider', wallet?.provider ?? ''),
    };
  }, [draft, seed, wallet]);

  const errors = useMemo<WalletFormErrors>(
    () => (isSubmitted ? { ...validateWalletForm(values), ...serverErrors } : serverErrors),
    [isSubmitted, serverErrors, values],
  );

  const setValue = useCallback((field: keyof WalletFormValues, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    // O erro que o servidor apontou neste campo deixa de valer no instante em
    // que ele muda: manter a mensagem seria acusar um texto que já não existe.
    setServerErrors((current) => {
      const keys: (keyof WalletFormErrors)[] =
        field === 'ensLabel' || field === 'ensDomain' ? [field, 'ensName'] : [field];
      if (!keys.some((key) => key in current)) return current;

      const next = { ...current };
      for (const key of keys) delete next[key];
      return next;
    });
  }, []);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      // Barreira contra duplo-submit: o botão já fica desabilitado, mas Enter
      // repetido num campo chegaria aqui antes do render.
      if (isSaving) return;

      setIsSubmitted(true);
      setServerErrors({});

      const found = validateWalletForm(values);
      if (Object.keys(found).length > 0) {
        onFailed(null);
        return;
      }

      // As duas já passaram na validação; repetir os guards aqui é o que
      // permite ao corpo sair tipado, sem asserção.
      if (!isNetworkId(values.network) || !isWalletProvider(values.provider)) return;

      const body: CreateWalletRequest = {
        role,
        displayName: values.displayName.trim(),
        label: values.label.trim(),
        profileName: values.profileName.trim(),
        email: values.email.trim(),
        referralCode: values.referralCode.trim(),
        address: values.address.trim(),
        linkedReference: values.linkedReference.trim() || null,
        ensName: joinEnsName({ label: values.ensLabel, domain: values.ensDomain }),
        network: values.network,
        provider: values.provider,
      };

      /**
       * Trata a falha da mutation, pondo o erro da API nos campos.
       *
       * @param error - Erro normalizado pelo interceptor do Axios.
       */
      const onError = (error: NormalizedHttpError): void => {
        // O mapa de conflitos é o mesmo do perfil: `409` não traz campo, e quem
        // sabe que endereço repetido pertence ao campo `address` é a interface.
        const fieldErrors = toFormFieldErrors<WalletFormErrors>(error);
        setServerErrors(fieldErrors);
        onFailed(Object.keys(fieldErrors).length === 0 ? error : null);
      };

      if (wallet) {
        updateMutation.mutate(
          { walletId: wallet.id, body },
          {
            onSuccess: () => {
              // O rascunho é descartado: daqui em diante quem manda é a
              // carteira que o servidor devolveu no refetch.
              setDraft({});
              setIsSubmitted(false);
              onSaved(role, true);
            },
            onError,
          },
        );
        return;
      }

      createMutation.mutate(body, {
        onSuccess: () => {
          setDraft({});
          setIsSubmitted(false);
          onSaved(role, false);
        },
        onError,
      });
    },
    [createMutation, isSaving, onFailed, onSaved, role, updateMutation, values, wallet],
  );

  return {
    role,
    values,
    errors,
    isEditing: wallet !== null,
    isSaving,
    setValue,
    submit,
  };
}
