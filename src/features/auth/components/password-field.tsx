import { useState } from 'react';

import { FormField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EyeHiddenIcon, EyeVisibleIcon } from '@/features/auth/components/password-icons';
import { AUTH_COPY } from '@/features/auth/constants/auth';
import type { PasswordFieldProps } from '@/features/auth/types/auth-components';

/**
 * Campo de senha, com o olho de mostrar/ocultar quando o design o desenha.
 *
 * A alternancia e estado de apresentacao e por isso mora no componente. O botao
 * e um `button` de verdade (alcancavel por teclado, com `aria-pressed`), nao um
 * icone clicavel — o Figma desenha so o icone, mas ele precisa ser operavel.
 *
 * A confirmacao de senha nao tem o olho no painel de autenticacao
 * (`revealable={false}`): la so o campo principal revela o valor. No frame do
 * perfil os tres campos tem o olho, e o rotulo e visivel (`hideLabel={false}`).
 *
 * @param props - Identificacao, valor, erro, callbacks e se o campo revela o valor.
 */
export function PasswordField({
  id,
  name,
  label,
  hideLabel = true,
  placeholder,
  value,
  error,
  disabled = false,
  autoComplete,
  revealable = true,
  onValueChange,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const isRevealed = revealable && isVisible;

  return (
    <FormField id={id} label={label} hideLabel={hideLabel} error={error}>
      {(field) => (
        <div className="relative">
          <Input
            {...field}
            name={name}
            type={isRevealed ? 'text' : 'password'}
            autoComplete={autoComplete}
            placeholder={placeholder}
            value={value}
            disabled={disabled}
            className={revealable ? 'pr-12' : undefined}
            onChange={(event) => {
              onValueChange(event.target.value);
            }}
          />
          {revealable ? (
            <Button
              variant="ghost"
              size="icon"
              disabled={disabled}
              className="text-icon-muted absolute inset-y-0 right-1 my-auto"
              aria-pressed={isVisible}
              aria-controls={id}
              onClick={() => {
                setIsVisible((previous) => !previous);
              }}
            >
              {isVisible ? (
                <EyeVisibleIcon className="size-5" />
              ) : (
                <EyeHiddenIcon className="size-5" />
              )}
              <span className="sr-only">
                {isVisible ? AUTH_COPY.hidePassword : AUTH_COPY.showPassword}
              </span>
            </Button>
          ) : null}
        </div>
      )}
    </FormField>
  );
}
