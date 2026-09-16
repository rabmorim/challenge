import { AUTH_VALIDATION, AUTH_VALIDATION_MESSAGES } from '@/features/auth/constants/auth';
import type {
  AuthFieldErrors,
  LoginFormValues,
  SignUpFormValues,
} from '@/features/auth/types/auth-forms';
import type { NormalizedHttpError } from '@/types/http';

/**
 * Validacao dos formularios de autenticacao.
 *
 * Funcoes puras, sem React: o hook decide quando validar e o componente so
 * exibe. O cliente valida o obvio (obrigatorios, formato, senhas iguais) para
 * poupar ida a rede; a palavra final continua sendo a da API, cujos
 * `fieldErrors` sao mapeados de volta ao campo por `toFieldErrors`.
 */

/**
 * Valida o formulario de login.
 *
 * @param values - Valores digitados.
 * @returns Erros por campo (objeto vazio quando esta valido).
 */
export function validateLogin(values: LoginFormValues): AuthFieldErrors {
  const errors: AuthFieldErrors = {};

  if (values.email.trim().length === 0) errors.email = AUTH_VALIDATION_MESSAGES.emailRequired;
  else if (!AUTH_VALIDATION.emailPattern.test(values.email.trim())) {
    errors.email = AUTH_VALIDATION_MESSAGES.emailInvalid;
  }

  if (values.password.length === 0) errors.password = AUTH_VALIDATION_MESSAGES.passwordRequired;

  return errors;
}

/**
 * Valida o formulario de cadastro.
 *
 * @param values - Valores digitados.
 * @returns Erros por campo (objeto vazio quando esta valido).
 */
export function validateSignUp(values: SignUpFormValues): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  const username = values.username.trim();

  if (username.length === 0) errors.username = AUTH_VALIDATION_MESSAGES.usernameRequired;
  else if (username.length < AUTH_VALIDATION.minUsernameLength) {
    errors.username = AUTH_VALIDATION_MESSAGES.usernameTooShort;
  }

  if (values.email.trim().length === 0) errors.email = AUTH_VALIDATION_MESSAGES.emailRequired;
  else if (!AUTH_VALIDATION.emailPattern.test(values.email.trim())) {
    errors.email = AUTH_VALIDATION_MESSAGES.emailInvalid;
  }

  if (values.password.length === 0) errors.password = AUTH_VALIDATION_MESSAGES.passwordRequired;
  else if (values.password.length < AUTH_VALIDATION.minPasswordLength) {
    errors.password = AUTH_VALIDATION_MESSAGES.passwordTooShort;
  }

  if (values.passwordConfirmation.length === 0) {
    errors.passwordConfirmation = AUTH_VALIDATION_MESSAGES.passwordConfirmationRequired;
  } else if (values.passwordConfirmation !== values.password) {
    errors.passwordConfirmation = AUTH_VALIDATION_MESSAGES.passwordsDoNotMatch;
  }

  return errors;
}

/**
 * Traduz um erro da API em erros por campo.
 *
 * Cobre os tres formatos que a API usa: `fieldErrors` (validacao), conflito de
 * cadastro (409, que aponta o campo pelo `reason`) e credencial invalida, que
 * nao pertence a um campo so — e por isso volta vazio, para virar mensagem
 * geral do formulario.
 *
 * @param error - Erro normalizado pelo interceptor do Axios.
 * @returns Erros por campo reconhecidos (vazio quando nenhum campo e culpado).
 */
export function toFieldErrors(error: NormalizedHttpError): AuthFieldErrors {
  if (error.reason === 'EMAIL_ALREADY_REGISTERED') return { email: error.message };
  if (error.reason === 'USERNAME_ALREADY_TAKEN') return { username: error.message };

  const fieldErrors = error.fieldErrors;
  if (!fieldErrors) return {};

  const known: AuthFieldErrors = {};
  if (fieldErrors.username) known.username = fieldErrors.username;
  if (fieldErrors.email) known.email = fieldErrors.email;
  if (fieldErrors.password) known.password = fieldErrors.password;
  if (fieldErrors.passwordConfirmation) {
    known.passwordConfirmation = fieldErrors.passwordConfirmation;
  }

  return known;
}
