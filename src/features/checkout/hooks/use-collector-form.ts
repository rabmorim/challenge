import { useCallback, useMemo, useState } from 'react';

import type { AuthenticatedUser } from '@/features/auth/types/user';
import { DEFAULT_ENS_DOMAIN } from '@/constants/ens';
import { validateCollectorForm } from '@/features/checkout/lib/collector-validation';
import type {
  CollectorFormApi,
  CollectorFormErrors,
  CollectorFormValues,
} from '@/features/checkout/types/checkout-state';
import type { Wallet } from '@/features/wallets/types/wallet';
import type { NetworkId } from '@/types/network';

/**
 * Formulário "Perfil do colecionador".
 *
 * Três comportamentos justificam o hook (o JSX só desenha):
 *
 * 1. **Prefill a partir do que já existe.** A conta preenche nome de usuário e
 *    e-mail; a carteira escolhida preenche endereço, rede e tipo. Pedir de novo
 *    dados que o servidor já tem é uma forma de erro.
 * 2. **A carteira escolhida manda nos campos dela** — até alguém editá-los.
 * 3. **Erros só depois da primeira tentativa.** Marcar campos em vermelho
 *    enquanto ainda se digita o primeiro deles é ruído; depois de um envio
 *    recusado, a validação acompanha cada tecla, e o erro sai da tela no
 *    momento em que deixa de ser verdade.
 *
 * **O prefill é derivado, não copiado.** O estado guarda só o que foi digitado
 * e quais campos foram tocados; os valores da carteira entram no render, por
 * cima dos campos intocados. Copiar a carteira para dentro do estado exigiria
 * um efeito que dispara a cada troca de seleção — e teria que adivinhar se
 * sobrescreve o que já estava lá. Derivando, a regra é uma linha: **campo
 * tocado vence a carteira**, e trocar de carteira atualiza exatamente os campos
 * que ninguém assumiu.
 *
 * Os erros da API caem nos MESMOS campos (`applyServerErrors`): a validação
 * local existe para poupar uma ida à rede, não para substituir a do servidor —
 * e some do campo assim que ele é editado.
 *
 * @param user - Usuário autenticado (o pagamento é rota privada, então ele já
 *   está resolvido no primeiro render, pelo `beforeLoad` da rota).
 * @param wallet - Carteira selecionada, quando já há uma.
 * @param defaultNetwork - Rede usada enquanto não há carteira escolhida.
 * @returns Valores, erros e as ações do formulário.
 */
export function useCollectorForm(
  user: AuthenticatedUser | null,
  wallet: Wallet | null,
  defaultNetwork: NetworkId,
): CollectorFormApi {
  const [draft, setDraft] = useState<CollectorFormValues>(() => ({
    displayName: '',
    username: user?.username ?? '',
    profileName: '',
    email: user?.email ?? '',
    walletAddress: '',
    secondaryWallet: null,
    referralCode: '',
    ensDomain: DEFAULT_ENS_DOMAIN,
    usesAlternateWallet: false,
    note: null,
    network: defaultNetwork,
    walletProvider: '',
  }));

  /** Campos que o usuário assumiu — a carteira não os sobrescreve mais. */
  const [touched, setTouched] = useState<ReadonlySet<keyof CollectorFormValues>>(new Set());
  const [serverErrors, setServerErrors] = useState<CollectorFormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const values = useMemo<CollectorFormValues>(() => {
    if (!wallet) return draft;

    const next = { ...draft };

    /**
     * Copia um valor da carteira para o campo, se ninguém o tiver assumido.
     *
     * @param field - Campo a preencher.
     * @param value - Valor vindo da carteira selecionada.
     */
    const fromWallet = <TField extends keyof CollectorFormValues>(
      field: TField,
      value: CollectorFormValues[TField],
    ): void => {
      if (!touched.has(field)) next[field] = value;
    };

    // "Usar outra carteira?" marcado significa que o endereço é do usuário,
    // mesmo sem ele ter digitado nada ainda.
    if (!draft.usesAlternateWallet) fromWallet('walletAddress', wallet.address);
    fromWallet('secondaryWallet', wallet.ensName);
    fromWallet('network', wallet.network);
    fromWallet('walletProvider', wallet.provider);

    return next;
  }, [draft, touched, wallet]);

  const errors = useMemo<CollectorFormErrors>(
    () => (isSubmitted ? { ...validateCollectorForm(values), ...serverErrors } : {}),
    [isSubmitted, serverErrors, values],
  );

  const setValue = useCallback(
    <TField extends keyof CollectorFormValues>(
      field: TField,
      value: CollectorFormValues[TField],
    ) => {
      setDraft((current) => ({ ...current, [field]: value }));
      setTouched((current) => (current.has(field) ? current : new Set(current).add(field)));
      // O erro que o servidor apontou neste campo deixa de valer no instante em
      // que ele muda: manter a mensagem seria acusar um texto que já não existe.
      setServerErrors((current) => {
        if (!(field in current)) return current;
        const { [field]: _removed, ...rest } = current;
        return rest;
      });
    },
    [],
  );

  const validate = useCallback(() => {
    setIsSubmitted(true);
    const found = validateCollectorForm(values);
    return Object.keys(found).length === 0 ? values : null;
  }, [values]);

  const applyServerErrors = useCallback((fieldErrors: Record<string, string>) => {
    setIsSubmitted(true);
    setServerErrors(fieldErrors as CollectorFormErrors);
  }, []);

  return { values, errors, isSubmitted, setValue, validate, applyServerErrors };
}
