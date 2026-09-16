import { HttpResponse } from 'msw';

import type {
  ApiErrorCode,
  ApiErrorPayload,
  ApiErrorReason,
  AvailabilityConflict,
} from '@/types/api';

/**
 * Construtores das respostas de erro da simulacao.
 *
 * Centralizar aqui garante que todo handler devolva exatamente o envelope que
 * o interceptor do Axios espera (`ApiErrorPayload`) e que o status HTTP seja
 * sempre coerente com o `code`.
 */

// Os construtores devolvem `Response` (e nao `HttpResponse<ApiErrorPayload>`)
// porque um resolver do MSW mistura corpo de erro com corpo de sucesso: manter
// o tipo largo evita que a inferencia do resolver se prenda ao envelope de erro.

/** Status HTTP correspondente a cada codigo de erro. */
const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 422,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  TRANSIENT_FAILURE: 503,
  // Nao sao produzidos pelo servidor (nascem no cliente), mas o mapa e total
  // para que acrescentar um codigo novo nao passe batido.
  NETWORK_ERROR: 502,
  TIMEOUT: 504,
  UNKNOWN: 500,
};

/** Dados opcionais que acompanham um erro. */
interface ErrorOptions {
  reason?: ApiErrorReason;
  fieldErrors?: Record<string, string>;
  conflicts?: AvailabilityConflict[];
}

/**
 * Monta uma resposta de erro no envelope padrao.
 *
 * @param code - Classe do erro.
 * @param message - Mensagem em portugues, pronta para exibicao.
 * @param options - `reason`, erros por campo e conflitos de disponibilidade.
 * @returns Resposta HTTP com o status correspondente ao codigo.
 */
export function errorResponse(
  code: ApiErrorCode,
  message: string,
  options: ErrorOptions = {},
): Response {
  const payload: ApiErrorPayload = {
    code,
    message,
    ...(options.reason ? { reason: options.reason } : {}),
    ...(options.fieldErrors ? { fieldErrors: options.fieldErrors } : {}),
    ...(options.conflicts ? { conflicts: options.conflicts } : {}),
  };

  return HttpResponse.json(payload, { status: STATUS_BY_CODE[code] });
}

/**
 * Erro de validacao de formulario.
 *
 * @param fieldErrors - Mensagem por campo.
 * @param message - Mensagem geral opcional.
 * @returns Resposta `422`.
 */
export function validationError(
  fieldErrors: Record<string, string>,
  message = 'Revise os campos destacados.',
): Response {
  return errorResponse('VALIDATION_ERROR', message, { fieldErrors });
}

/**
 * Sessao ausente, invalida ou expirada.
 *
 * @param reason - Subtipo do erro (`SESSION_EXPIRED` na expiracao).
 * @param message - Mensagem exibida.
 * @returns Resposta `401`.
 */
export function unauthenticated(
  reason?: ApiErrorReason,
  message = 'Sua sessao nao esta mais valida. Entre novamente.',
): Response {
  return errorResponse('UNAUTHENTICATED', message, reason ? { reason } : {});
}

/**
 * Recurso inexistente.
 *
 * @param message - Mensagem exibida.
 * @returns Resposta `404`.
 */
export function notFound(message = 'Recurso nao encontrado.'): Response {
  return errorResponse('NOT_FOUND', message);
}

/**
 * Acesso negado a um recurso de outro usuario.
 *
 * @param message - Mensagem exibida.
 * @returns Resposta `403`.
 */
export function forbidden(
  message = 'Voce nao tem permissao para acessar este recurso.',
): Response {
  return errorResponse('FORBIDDEN', message);
}

/**
 * Conflito de estado (cadastro, idempotencia, preco ou disponibilidade).
 *
 * @param reason - Subtipo do conflito.
 * @param message - Mensagem exibida.
 * @param conflicts - Itens divergentes, quando o conflito e de compra.
 * @returns Resposta `409`.
 */
export function conflict(
  reason: ApiErrorReason,
  message: string,
  conflicts?: AvailabilityConflict[],
): Response {
  return errorResponse('CONFLICT', message, conflicts ? { reason, conflicts } : { reason });
}

/**
 * Falha transitoria do servidor simulado.
 *
 * @param message - Mensagem exibida.
 * @returns Resposta `503`.
 */
export function transientFailure(
  message = 'O servico esta instavel. Tente novamente em instantes.',
): Response {
  return errorResponse('TRANSIENT_FAILURE', message);
}
