import { PasswordField } from '@/features/auth/components/password-field';
import { PROFILE_COPY } from '@/features/profile/constants/profile';
import type { PasswordSectionProps } from '@/features/profile/types/profile-components';

/**
 * Bloco "Alterar senha" do frame.
 *
 * Os três campos são opcionais: deixá-los em branco é como se diz "não quero
 * trocar a senha" (ver `useProfileForm`). Por isso nenhum deles leva o
 * asterisco de obrigatório — marcá-los assim faria o formulário exigir a senha
 * atual de quem só queria corrigir o próprio nome.
 *
 * Os três têm o olho de mostrar/ocultar, como o frame desenha — inclusive a
 * confirmação, que no painel de autenticação não tem. O botão do olho é um
 * `button` de verdade, com `aria-pressed`, e não um ícone clicável.
 *
 * @param props - Formulário do perfil (valores, erros e travamento).
 */
export function PasswordSection({ form }: PasswordSectionProps) {
  const { values, errors, setValue, isSaving } = form;

  return (
    <section aria-labelledby="profile-password-title" className="flex flex-col gap-5">
      <h2 id="profile-password-title" className="text-body-lg font-bold">
        {PROFILE_COPY.passwordTitle}
      </h2>

      <PasswordField
        id="profile-current-password"
        name="currentPassword"
        label={PROFILE_COPY.currentPassword}
        hideLabel={false}
        value={values.currentPassword}
        error={errors.currentPassword}
        disabled={isSaving}
        autoComplete="current-password"
        onValueChange={(value) => {
          setValue('currentPassword', value);
        }}
      />

      <PasswordField
        id="profile-new-password"
        name="newPassword"
        label={PROFILE_COPY.newPassword}
        hideLabel={false}
        value={values.newPassword}
        error={errors.newPassword}
        disabled={isSaving}
        autoComplete="new-password"
        onValueChange={(value) => {
          setValue('newPassword', value);
        }}
      />

      <PasswordField
        id="profile-new-password-confirmation"
        name="newPasswordConfirmation"
        label={PROFILE_COPY.newPasswordConfirmation}
        hideLabel={false}
        value={values.newPasswordConfirmation}
        error={errors.newPasswordConfirmation}
        disabled={isSaving}
        autoComplete="new-password"
        onValueChange={(value) => {
          setValue('newPasswordConfirmation', value);
        }}
      />
    </section>
  );
}
