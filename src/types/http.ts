import type { ApiErrorCode, ApiErrorPayload, ApiErrorReason, AvailabilityConflict } from '@/types/api';

/**
 * Erro normalizado produzido pelo interceptor de resposta do Axios.
 * A interface consome sempre esta forma, nunca o `AxiosError` cru.
 */
export interface NormalizedHttpError {
  /** Codigo estavel para decidir o tratamento (ver `ApiErrorCode`). */
  code: ApiErrorCode;
  /** Mensagem pronta para exibicao. */
  message: string;
  /** Subtipo estavel do erro, quando a API o envia (ver `ApiErrorReason`). */
  reason?: ApiErrorReason;
  /** Status HTTP, ausente em falha de rede/timeout. */
  status?: number;
  /** Erros por campo, quando a API devolve validacao. */
  fieldErrors?: ApiErrorPayload['fieldErrors'];
  /** Itens divergentes, quando o conflito e de preco/disponibilidade. */
  conflicts?: AvailabilityConflict[];
}
