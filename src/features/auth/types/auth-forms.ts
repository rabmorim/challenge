import type { FormEvent } from 'react';

import type { AUTH_FIELDS } from '@/features/auth/constants/auth';

/** Campo de formulario de autenticacao. */
export type AuthFieldName = (typeof AUTH_FIELDS)[keyof typeof AUTH_FIELDS];

/** Erros por campo — as chaves casam com `fieldErrors` da API. */
export type AuthFieldErrors = Partial<Record<AuthFieldName, string>>;

/** Valores do formulario de login. */
export interface LoginFormValues {
  email: string;
  password: string;
}

/** Valores do formulario de cadastro. */
export interface SignUpFormValues {
  username: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

/**
 * Controle que um formulario de autenticacao expoe ao seu JSX.
 * O componente so compoe: valores, erros e submit vem do hook.
 */
export interface AuthFormController<TValues> {
  values: TValues;
  errors: AuthFieldErrors;
  /** Mensagem geral do submit (erro da API que nao pertence a um campo). */
  formError: string | null;
  /** `true` enquanto a mutation esta em andamento. */
  isSubmitting: boolean;
  /** Atualiza um campo e limpa o erro dele. */
  setValue: (field: keyof TValues & AuthFieldName, value: string) => void;
  /** Handler do `onSubmit` do formulario. */
  submit: (event: FormEvent<HTMLFormElement>) => void;
}
