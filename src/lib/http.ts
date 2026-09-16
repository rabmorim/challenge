import axios, { AxiosError, type AxiosInstance } from 'axios';

import { BEARER_PREFIX, GUEST_ID_HEADER } from '@/constants/api';
import { ENV } from '@/constants/env';
import { getGuestId, getSessionToken, clearSessionToken } from '@/lib/request-identity';
import { notifySessionExpired } from '@/lib/session-expiry';
import type { ApiErrorCode, ApiErrorPayload } from '@/types/api';
import type { NormalizedHttpError } from '@/types/http';

/**
 * Traduz o status HTTP em um codigo de erro estavel quando a API nao envia um.
 *
 * @param status - Status HTTP da resposta.
 * @returns Codigo de erro correspondente ao status.
 */
function codeFromStatus(status: number): ApiErrorCode {
  if (status === 401) return 'UNAUTHENTICATED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'CONFLICT';
  if (status === 422) return 'VALIDATION_ERROR';
  if (status === 429) return 'RATE_LIMITED';
  if (status >= 500) return 'TRANSIENT_FAILURE';
  return 'UNKNOWN';
}

/**
 * Verifica se o corpo recebido segue o envelope de erro da API simulada.
 *
 * @param body - Corpo da resposta de erro, de tipo desconhecido.
 * @returns `true` quando o corpo tem `code` e `message` como strings.
 */
function isApiErrorPayload(body: unknown): body is ApiErrorPayload {
  if (typeof body !== 'object' || body === null) return false;
  const candidate = body as Partial<ApiErrorPayload>;
  return typeof candidate.code === 'string' && typeof candidate.message === 'string';
}

/**
 * Converte qualquer falha do Axios na forma unica consumida pela interface.
 * Falha de rede e timeout, que nao tem resposta, ganham codigo proprio.
 *
 * @param error - Erro lancado pelo Axios.
 * @returns Erro normalizado com codigo, mensagem e (quando houver) status.
 */
function normalizeError(error: AxiosError): NormalizedHttpError {
  if (!error.response) {
    const isTimeout = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
    return isTimeout
      ? { code: 'TIMEOUT', message: 'A requisicao demorou demais e foi cancelada.' }
      : { code: 'NETWORK_ERROR', message: 'Nao foi possivel conectar ao servidor.' };
  }

  const { status, data } = error.response;

  if (isApiErrorPayload(data)) {
    // `reason` e `conflicts` sao repassados intactos: sao o que a interface usa
    // para diferenciar, por exemplo, cupom expirado de cupom inexistente, ou
    // para listar os itens cujo preco mudou durante a compra.
    return {
      code: data.code,
      message: data.message,
      status,
      ...(data.reason ? { reason: data.reason } : {}),
      ...(data.fieldErrors ? { fieldErrors: data.fieldErrors } : {}),
      ...(data.conflicts ? { conflicts: data.conflicts } : {}),
    };
  }

  return {
    code: codeFromStatus(status),
    message: 'Nao foi possivel completar a operacao. Tente novamente.',
    status,
  };
}

/**
 * Instancia unica e tipada do Axios — toda chamada REST do app passa por ela.
 * `withCredentials` mantem o cookie de sessao simulado.
 */
export const httpClient: AxiosInstance = axios.create({
  baseURL: ENV.apiBaseUrl,
  timeout: ENV.requestTimeoutMs,
  withCredentials: true,
  headers: { Accept: 'application/json' },
});

/**
 * Interceptor de requisicao: anexa a identidade do chamador.
 *
 * O token da sessao vai em `Authorization` e a identidade do visitante em
 * `x-guest-id` — o servidor simulado usa a segunda para manter o carrinho de
 * quem ainda nao entrou e transferi-lo no login.
 */
httpClient.interceptors.request.use((config) => {
  const token = getSessionToken();
  if (token) config.headers.set('Authorization', `${BEARER_PREFIX}${token}`);
  config.headers.set(GUEST_ID_HEADER, getGuestId());
  return config;
});

/**
 * Detecta o 401 que invalida a sessao corrente e avisa quem trata o ciclo de
 * vida dela.
 *
 * Duas exclusoes importam: credencial errada no login tambem responde 401 e
 * NAO e sessao perdida (o usuario nunca chegou a ter uma); e sem token local
 * nao havia sessao para perder, entao o aviso seria ruido. O token local sai
 * aqui porque a partir deste ponto ele so produziria novos 401.
 *
 * @param error - Erro ja normalizado pelo interceptor.
 */
function reportSessionLoss(error: NormalizedHttpError): void {
  if (error.code !== 'UNAUTHENTICATED') return;
  if (error.reason === 'INVALID_CREDENTIALS') return;
  if (!getSessionToken()) return;

  clearSessionToken();
  notifySessionExpired({
    reason: error.reason === 'SESSION_EXPIRED' ? 'SESSION_EXPIRED' : 'SESSION_INVALID',
  });
}

httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const normalized =
      error instanceof AxiosError
        ? normalizeError(error)
        : ({ code: 'UNKNOWN', message: 'Erro inesperado.' } satisfies NormalizedHttpError);

    reportSessionLoss(normalized);
    return Promise.reject(normalized);
  },
);

/**
 * Type guard para o erro normalizado, util em `onError` de queries/mutations.
 *
 * @param error - Valor capturado no tratamento de erro.
 * @returns `true` quando o valor e um `NormalizedHttpError`.
 */
export function isHttpError(error: unknown): error is NormalizedHttpError {
  if (typeof error !== 'object' || error === null) return false;
  const candidate = error as Partial<NormalizedHttpError>;
  return typeof candidate.code === 'string' && typeof candidate.message === 'string';
}
