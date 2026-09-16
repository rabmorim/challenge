import { FormField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormStatus } from '@/features/auth/components/form-status';
import { PasswordField } from '@/features/auth/components/password-field';
import { SocialAuthButtons } from '@/features/auth/components/social-auth-buttons';
import { AUTH_COPY, AUTH_FIELDS, AUTH_SUBTITLE_ID } from '@/features/auth/constants/auth';
import { useSignUpForm } from '@/features/auth/hooks/use-sign-up-form';
import type { AuthFormProps } from '@/features/auth/types/auth-components';

/** Textos desta aba. */
const COPY = AUTH_COPY.signUp;

/**
 * Formulario de criacao de conta.
 *
 * O conflito de cadastro (409) chega marcado no campo culpado pelo hook, entao
 * aqui nao ha tratamento especial: e mais um `error` de campo.
 *
 * @param props - Callbacks de sucesso e de troca de aba.
 */
export function SignUpForm({ onAuthenticated }: AuthFormProps) {
  const form = useSignUpForm(onAuthenticated);

  return (
    <form noValidate onSubmit={form.submit} aria-busy={form.isSubmitting} className="flex flex-col">
      {/* O frame de 414 nao traz o subtitulo, mas ele e a descricao acessivel do
          dialogo: `sr-only` o esconde sem tira-lo do DOM nem ocupar espaco. */}
      <p
        id={AUTH_SUBTITLE_ID}
        className="text-foreground text-modal sr-only text-center sm:not-sr-only"
      >
        {COPY.subtitle}
      </p>

      <div className="mt-7 flex flex-col gap-4 sm:gap-3">
        <FormField
          id="signup-username"
          label={COPY.usernameLabel}
          hideLabel
          error={form.errors.username}
        >
          {(field) => (
            <Input
              {...field}
              name={AUTH_FIELDS.username}
              autoComplete="username"
              placeholder={COPY.usernamePlaceholder}
              value={form.values.username}
              onChange={(event) => {
                form.setValue('username', event.target.value);
              }}
            />
          )}
        </FormField>

        <FormField id="signup-email" label={COPY.emailLabel} hideLabel error={form.errors.email}>
          {(field) => (
            <Input
              {...field}
              name={AUTH_FIELDS.email}
              type="email"
              autoComplete="email"
              placeholder={COPY.emailPlaceholder}
              value={form.values.email}
              onChange={(event) => {
                form.setValue('email', event.target.value);
              }}
            />
          )}
        </FormField>

        <PasswordField
          id="signup-password"
          name={AUTH_FIELDS.password}
          label={COPY.passwordLabel}
          placeholder={COPY.passwordPlaceholder}
          autoComplete="new-password"
          value={form.values.password}
          error={form.errors.password}
          onValueChange={(value) => {
            form.setValue('password', value);
          }}
        />

        <PasswordField
          id="signup-password-confirmation"
          name={AUTH_FIELDS.passwordConfirmation}
          label={COPY.passwordConfirmationLabel}
          placeholder={COPY.passwordConfirmationPlaceholder}
          autoComplete="new-password"
          revealable={false}
          value={form.values.passwordConfirmation}
          error={form.errors.passwordConfirmation}
          onValueChange={(value) => {
            form.setValue('passwordConfirmation', value);
          }}
        />
      </div>

      {/* Os dois frames rotulam o envio de formas diferentes. Alternar por
          `hidden` (e nao por opacidade) mantem o nome acessivel do botao igual
          ao rotulo visivel: o que esta em `display: none` nao entra no calculo. */}
      <Button type="submit" className="mt-10 py-5 sm:mt-7 sm:py-3.5" disabled={form.isSubmitting}>
        {form.isSubmitting ? (
          COPY.submitting
        ) : (
          <>
            <span className="sm:hidden">{COPY.mobileSubmit}</span>
            <span className="hidden sm:inline">{COPY.submit}</span>
          </>
        )}
      </Button>

      <FormStatus message={form.formError} />

      <div className="mt-4">
        <SocialAuthButtons />
      </div>
    </form>
  );
}
