import type { NormalizedHttpError } from '@/types/http';

/**
 * Traducao de um erro da API para os campos de um formulario.
 *
 * Duas formas chegam do servidor e precisam cair no mesmo lugar: `422` com
 * `fieldErrors` (validacao) e `409` com `reason` (conflito de cadastro). O
 * conflito nao traz campo — quem sabe que `EMAIL_ALREADY_REGISTERED` pertence
 * ao campo de e-mail e a interface, e este mapa e o unico lugar onde isso esta
 * escrito.
 *
 * Fica no escopo global porque perfil e carteiras precisam da MESMA regra: uma
 * copia por feature divergiria no primeiro `reason` novo que aparecesse.
 */

/** Campo responsavel por cada conflito de cadastro. */
const FIELD_BY_CONFLICT_REASON: Record<string, string> = {
  EMAIL_ALREADY_REGISTERED: 'email',
  USERNAME_ALREADY_TAKEN: 'username',
  WALLET_ADDRESS_ALREADY_REGISTERED: 'address',
};

/**
 * Converte o erro da API em erros por campo.
 *
 * @param error - Erro normalizado pelo interceptor do Axios.
 * @returns Erros por campo; vazio quando o erro nao aponta nenhum (rede, 5xx),
 *   caso em que a tela mostra a mensagem geral.
 */
export function toFormFieldErrors<TErrors extends Record<string, string | undefined>>(
  error: NormalizedHttpError,
): TErrors {
  if (error.fieldErrors && Object.keys(error.fieldErrors).length > 0) {
    return error.fieldErrors as TErrors;
  }

  const field = error.reason ? FIELD_BY_CONFLICT_REASON[error.reason] : undefined;
  return (field ? { [field]: error.message } : {}) as TErrors;
}
