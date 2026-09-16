import { useCallback, useState, type FormEvent } from 'react';

import { AUTH_VALIDATION_MESSAGES } from '@/features/auth/constants/auth';
import { useSignUpMutation } from '@/features/auth/hooks/use-session-mutations';
import { toFieldErrors, validateSignUp } from '@/features/auth/lib/auth-validation';
import type {
  AuthFieldErrors,
  AuthFormController,
  SignUpFormValues,
} from '@/features/auth/types/auth-forms';

/** Formulario em branco. */
const EMPTY_VALUES: SignUpFormValues = {
  username: '',
  email: '',
  password: '',
  passwordConfirmation: '',
};

/**
 * Regras do formulario de cadastro.
 *
 * Alem da validacao do cliente, traduz o conflito de cadastro (409) para o
 * campo culpado — e o que faz "e-mail ja registrado" aparecer ao lado do
 * e-mail, e nao como erro generico do formulario.
 *
 * @param onAuthenticated - Chamado depois de a conta ser criada e a sessao aberta.
 * @returns Controle do formulario consumido pelo JSX.
 */
export function useSignUpForm(onAuthenticated: () => void): AuthFormController<SignUpFormValues> {
  const [values, setValues] = useState<SignUpFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const mutation = useSignUpMutation();

  const setValue = useCallback((field: keyof SignUpFormValues, value: string) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => (previous[field] ? { ...previous, [field]: undefined } : previous));
  }, []);

  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (mutation.isPending) return;

      const validationErrors = validateSignUp(values);
      setErrors(validationErrors);

      if (Object.keys(validationErrors).length > 0) {
        setFormError(AUTH_VALIDATION_MESSAGES.formInvalid);
        return;
      }

      setFormError(null);
      mutation.mutate(
        {
          username: values.username.trim(),
          email: values.email.trim(),
          password: values.password,
          passwordConfirmation: values.passwordConfirmation,
        },
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
