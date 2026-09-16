import { useCallback, useState, type FormEvent } from 'react';

import { AUTH_VALIDATION_MESSAGES } from '@/features/auth/constants/auth';
import { useLoginMutation } from '@/features/auth/hooks/use-session-mutations';
import { toFieldErrors, validateLogin } from '@/features/auth/lib/auth-validation';
import type {
  AuthFieldErrors,
  AuthFormController,
  LoginFormValues,
} from '@/features/auth/types/auth-forms';

/** Formulario em branco. */
const EMPTY_VALUES: LoginFormValues = { email: '', password: '' };

/**
 * Regras do formulario de login.
 *
 * Toda a logica (validacao, mutation, mapeamento de erro para campo) fica no
 * hook; o componente so compoe rotulos, campos e mensagens.
 *
 * @param onAuthenticated - Chamado depois de a sessao ser aberta com sucesso.
 * @returns Controle do formulario consumido pelo JSX.
 */
export function useLoginForm(onAuthenticated: () => void): AuthFormController<LoginFormValues> {
  const [values, setValues] = useState<LoginFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const mutation = useLoginMutation();

  const setValue = useCallback((field: keyof LoginFormValues, value: string) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    // Corrigir o campo limpa o erro dele: a mensagem antiga deixaria de ser verdade.
    setErrors((previous) => (previous[field] ? { ...previous, [field]: undefined } : previous));
  }, []);

  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      // Barreira contra duplo-submit: o botao ja fica desabilitado, mas Enter
      // repetido no campo chegaria aqui antes do render.
      if (mutation.isPending) return;

      const validationErrors = validateLogin(values);
      setErrors(validationErrors);

      if (Object.keys(validationErrors).length > 0) {
        setFormError(AUTH_VALIDATION_MESSAGES.formInvalid);
        return;
      }

      setFormError(null);
      mutation.mutate(
        { email: values.email.trim(), password: values.password },
        {
          onSuccess: onAuthenticated,
          onError: (error) => {
            const fieldErrors = toFieldErrors(error);
            setErrors(fieldErrors);
            setFormError(
              Object.keys(fieldErrors).length > 0
                ? AUTH_VALIDATION_MESSAGES.formInvalid
                : error.message,
            );
          },
        },
      );
    },
    [mutation, onAuthenticated, values],
  );

  return { values, errors, formError, isSubmitting: mutation.isPending, setValue, submit };
}
