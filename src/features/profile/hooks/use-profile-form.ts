import { useCallback, useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { PROFILE_MESSAGES } from '@/features/profile/constants/profile';
import { toFormFieldErrors } from '@/lib/field-errors';
import {
  isChangingPassword,
  validatePasswordChange,
  validateProfileFields,
} from '@/features/profile/lib/profile-validation';
import {
  useChangePasswordMutation,
  useUpdateProfileMutation,
} from '@/features/profile/hooks/use-profile-mutations';
import type { CollectorProfile, UpdateProfileRequest } from '@/features/profile/types/profile';
import type {
  ProfileFormApi,
  ProfileFormErrors,
  ProfileFormValues,
} from '@/features/profile/types/profile-state';
import { joinEnsName, splitEnsName } from '@/lib/ens-name';
import { isHttpError } from '@/lib/http';

/** Campos de senha, zerados depois de uma troca bem-sucedida. */
const EMPTY_PASSWORDS = {
  currentPassword: '',
  newPassword: '',
  newPasswordConfirmation: '',
} as const;

/**
 * Formulário "Perfil do colecionador".
 *
 * **O frame tem um "Salvar" só**, para os dados e para a troca de senha — e é
 * assim que ele fica. O que o hook faz é despachar: os campos de dados que
 * mudaram viram um `PATCH /profile`; os três campos de senha, quando
 * preenchidos, viram um `PUT /profile/password`. Deixá-los em branco é a forma
 * de dizer "não quero trocar a senha", então corrigir um nome nunca exige
 * digitar a senha atual.
 *
 * A ordem é sequencial de propósito: dados primeiro, senha só se os dados
 * passarem. Disparar as duas em paralelo poderia trocar a senha de um
 * formulário que o servidor acabou de recusar por conflito de e-mail — meio
 * envio aceito e meio recusado é o estado mais difícil de explicar a quem está
 * na tela.
 *
 * **O preenchimento é derivado, não copiado**: o estado guarda só o que foi
 * digitado, e o perfil carregado entra no render por baixo. Copiar o perfil
 * para dentro do estado exigiria um efeito a cada refetch e teria que adivinhar
 * se sobrescreve o que já estava digitado.
 *
 * **Erros só depois da primeira tentativa** — marcar campos em vermelho
 * enquanto se digita o primeiro deles é ruído. Depois de um envio recusado, a
 * validação acompanha cada tecla e o erro sai da tela quando deixa de ser
 * verdade. Os `fieldErrors` da API caem nos mesmos campos.
 *
 * Nenhuma senha sai deste hook: ela vive no estado local, viaja no corpo da
 * requisição e é apagada no sucesso. Não entra em cache, URL, toast nem log.
 *
 * @param userId - Dono do perfil (entra na query key do ramo privado).
 * @param profile - Perfil carregado, ou `undefined` enquanto ele não chega.
 * @returns Valores, erros e as ações do formulário.
 */
export function useProfileForm(
  userId: string,
  profile: CollectorProfile | undefined,
): ProfileFormApi {
  const [draft, setDraft] = useState<Partial<ProfileFormValues>>({});
  const [serverErrors, setServerErrors] = useState<ProfileFormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const updateMutation = useUpdateProfileMutation(userId);
  const passwordMutation = useChangePasswordMutation();

  const values = useMemo<ProfileFormValues>(() => {
    const ens = splitEnsName(profile?.ensName ?? null);

    return {
      displayName: draft.displayName ?? profile?.displayName ?? '',
      username: draft.username ?? profile?.username ?? '',
      email: draft.email ?? profile?.email ?? '',
      ensLabel: draft.ensLabel ?? ens.label,
      ensDomain: draft.ensDomain ?? ens.domain,
      walletLabel: draft.walletLabel ?? profile?.walletLabel ?? '',
      currentPassword: draft.currentPassword ?? '',
      newPassword: draft.newPassword ?? '',
      newPasswordConfirmation: draft.newPasswordConfirmation ?? '',
    };
  }, [draft, profile]);

  const errors = useMemo<ProfileFormErrors>(() => {
    if (!isSubmitted) return serverErrors;

    return {
      ...validateProfileFields(values),
      ...(isChangingPassword(values) ? validatePasswordChange(values) : {}),
      ...serverErrors,
    };
  }, [isSubmitted, serverErrors, values]);

  const setValue = useCallback((field: keyof ProfileFormValues, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    // O erro que o servidor apontou neste campo deixa de valer no instante em
    // que ele muda: manter a mensagem seria acusar um texto que já não existe.
    setServerErrors((current) => {
      // O rótulo do ENS é editado em `ensLabel`, mas o servidor reclama de
      // `ensName` — os dois erros precisam sair juntos.
      const keys: (keyof ProfileFormErrors)[] =
        field === 'ensLabel' || field === 'ensDomain' ? [field, 'ensName'] : [field];
      if (!keys.some((key) => key in current)) return current;

      const next = { ...current };
      for (const key of keys) delete next[key];
      return next;
    });
  }, []);

  /**
   * Monta o corpo do `PATCH` com apenas o que mudou.
   *
   * Enviar o formulário inteiro funcionaria, mas descreveria como alteração
   * algo que ninguém tocou — e o enunciado pede que o usuário possa revisar
   * antes de salvar. O diff é o que torna "salvei só a senha" um envio de
   * senha, e nada mais.
   *
   * @returns Campos alterados, ou `null` quando nada mudou.
   */
  const buildProfilePatch = useCallback((): UpdateProfileRequest | null => {
    if (!profile) return null;

    const patch: UpdateProfileRequest = {};
    const ensName = joinEnsName({ label: values.ensLabel, domain: values.ensDomain });

    if (values.displayName.trim() !== profile.displayName) {
      patch.displayName = values.displayName.trim();
    }
    if (values.username.trim() !== profile.username) patch.username = values.username.trim();
    if (values.email.trim().toLowerCase() !== profile.email) patch.email = values.email.trim();
    if (values.walletLabel.trim() !== profile.walletLabel) {
      patch.walletLabel = values.walletLabel.trim();
    }
    if (ensName !== profile.ensName) patch.ensName = ensName;

    return Object.keys(patch).length > 0 ? patch : null;
  }, [profile, values]);

  const isSaving = updateMutation.isPending || passwordMutation.isPending;

  /**
   * Põe o erro da API nos campos e avisa quem depende da região viva.
   *
   * Recebe `unknown` porque é o que o `catch` de `mutateAsync` entrega. O
   * interceptor do Axios normaliza toda falha REST; qualquer outra coisa que
   * chegue aqui não tem campo para apontar e vira aviso geral — relançar
   * dentro do `catch` de uma promessa flutuante só produziria uma rejeição
   * não tratada, deixando a tela sem explicação nenhuma.
   *
   * @param error - Falha de uma das mutations.
   */
  const reportFailure = useCallback((error: unknown) => {
    const fieldErrors = isHttpError(error) ? toFormFieldErrors<ProfileFormErrors>(error) : {};
    setServerErrors(fieldErrors);

    const message = isHttpError(error)
      ? PROFILE_MESSAGES.failed(error.message)
      : PROFILE_MESSAGES.unknownFailure;
    setAnnouncement(message);
    // Erro sem campo (rede, 5xx) não tem onde pousar no formulário: sem o
    // toast ele passaria despercebido por quem enxerga a tela.
    if (Object.keys(fieldErrors).length === 0) toast.error(message);
  }, []);

  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      // Barreira contra duplo-submit: o botão já fica desabilitado, mas Enter
      // repetido num campo chegaria aqui antes do render.
      if (isSaving || !profile) return;

      setIsSubmitted(true);
      setServerErrors({});

      const wantsPasswordChange = isChangingPassword(values);
      const found: ProfileFormErrors = {
        ...validateProfileFields(values),
        ...(wantsPasswordChange ? validatePasswordChange(values) : {}),
      };

      if (Object.keys(found).length > 0) {
        setAnnouncement(PROFILE_MESSAGES.invalid);
        return;
      }

      const patch = buildProfilePatch();

      void (async () => {
        try {
          if (patch) await updateMutation.mutateAsync(patch);
        } catch (error) {
          reportFailure(error);
          return;
        }

        if (!wantsPasswordChange) {
          setAnnouncement(PROFILE_MESSAGES.saved);
          toast.success(PROFILE_MESSAGES.saved);
          return;
        }

        try {
          await passwordMutation.mutateAsync({
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
            newPasswordConfirmation: values.newPasswordConfirmation,
          });
        } catch (error) {
          reportFailure(error);
          return;
        }

        // A senha nova não fica no estado nem um render a mais do que precisa.
        setDraft((current) => ({ ...current, ...EMPTY_PASSWORDS }));
        const message = patch
          ? PROFILE_MESSAGES.savedWithPassword
          : PROFILE_MESSAGES.passwordChanged;
        setAnnouncement(message);
        toast.success(message);
      })();
    },
    [
      buildProfilePatch,
      isSaving,
      passwordMutation,
      profile,
      reportFailure,
      updateMutation,
      values,
    ],
  );

  return { values, errors, isSaving, announcement, setValue, submit };
}
