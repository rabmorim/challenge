import { toast } from 'sonner';

import { FormField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormStatus } from '@/features/auth/components/form-status';
import { PasswordField } from '@/features/auth/components/password-field';
import { SocialAuthButtons } from '@/features/auth/components/social-auth-buttons';
import {
  AUTH_COPY,
  AUTH_FIELDS,
  AUTH_SUBTITLE_ID,
  AUTH_UNAVAILABLE_MESSAGES,
} from '@/features/auth/constants/auth';
import { useLoginForm } from '@/features/auth/hooks/use-login-form';
import type { AuthFormProps } from '@/features/auth/types/auth-components';

/** Textos desta aba. */
const COPY = AUTH_COPY.signIn;

/**
 * Formulario de entrada na conta.
 *
 * So compoe: validacao, mutation e mapeamento de erro para campo vivem em
 * `useLoginForm`.
 *
 * @param props - Callbacks de sucesso e de troca de aba.
 */
export function LoginForm({ onAuthenticated }: AuthFormProps) {
  const form = useLoginForm(onAuthenticated);

  return (
    <form noValidate onSubmit={form.submit} aria-busy={form.isSubmitting} className="flex flex-col">
      <p id={AUTH_SUBTITLE_ID} className="text-foreground text-modal text-center">
        {COPY.subtitle}
      </p>

      <div className="mt-7 flex flex-col gap-3">
        <FormField id="login-email" label={COPY.emailLabel} hideLabel error={form.errors.email}>
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
          id="login-password"
          name={AUTH_FIELDS.password}
          label={COPY.passwordLabel}
          placeholder={COPY.passwordPlaceholder}
          autoComplete="current-password"
          value={form.values.password}
          error={form.errors.password}
          onValueChange={(value) => {
            form.setValue('password', value);
          }}
        />
      </div>

      <Button
        variant="link"
        size="inline"
        className="mt-5 self-end"
        onClick={() => {
          toast.info(AUTH_UNAVAILABLE_MESSAGES.passwordRecovery);
        }}
      >
        {COPY.forgotPassword}
      </Button>

      <Button type="submit" className="mt-7" disabled={form.isSubmitting}>
        {form.isSubmitting ? COPY.submitting : COPY.submit}
      </Button>

      <FormStatus message={form.formError} />

      <div className="mt-4">
        <SocialAuthButtons />
      </div>
    </form>
  );
}
