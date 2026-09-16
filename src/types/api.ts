/**
 * Contratos compartilhados de transporte REST.
 * Tipos especificos de uma feature vivem em `features/<x>/types`.
 */

/** Data/hora em ISO 8601 (ex.: `2026-02-11T14:03:00.000Z`). */
export type IsoDateTime = string;

/**
 * Valor monetario em ETH.
 * Sempre string decimal — nunca `number`: ponto flutuante perde precisao em
 * somas de valores monetarios, e a apresentacao precisa bater com o servidor.
 */
export type EthAmount = string;

/** Quantidade de unidades. Sempre inteiro nao negativo. */
export type Quantity = number;

/**
 * Classe do erro devolvido pela API. Mapeia (mas nao repete) o status HTTP:
 * a interface decide o tratamento por este codigo, nunca pelo numero.
 */
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'TRANSIENT_FAILURE'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'UNKNOWN';

/**
 * Subtipo estavel do erro, para quando `code` sozinho nao diz o suficiente.
 * Ex.: `CONFLICT` cobre e-mail repetido, edicao esgotada e reuso de chave de
 * idempotencia — situacoes com tratamento de interface completamente diferente.
 */
export type ApiErrorReason =
  | 'EMAIL_ALREADY_REGISTERED'
  | 'USERNAME_ALREADY_TAKEN'
  | 'INVALID_CREDENTIALS'
  | 'SESSION_EXPIRED'
  | 'INCORRECT_PASSWORD'
  | 'COUPON_NOT_FOUND'
  | 'COUPON_EXPIRED'
  | 'COUPON_NOT_APPLICABLE'
  | 'QUOTE_EXPIRED'
  | 'QUOTE_STALE'
  | 'PRICE_CHANGED'
  | 'EDITION_SOLD_OUT'
  | 'QUANTITY_ABOVE_LIMIT'
  | 'EMPTY_CART'
  | 'IDEMPOTENCY_KEY_REUSED'
  | 'ORDER_ALREADY_FINALIZED'
  | 'PAYMENT_DECLINED'
  | 'WALLET_UNAVAILABLE'
  | 'WALLET_ADDRESS_ALREADY_REGISTERED';

/**
 * Divergencia entre o que o cliente cotou e o que o servidor tem agora.
 * Acompanha os conflitos de preco/disponibilidade para que a interface consiga
 * mostrar exatamente o que mudou e pedir nova confirmacao.
 */
export interface AvailabilityConflict {
  nftId: string;
  /** Nome do NFT, para a mensagem nao precisar de outra requisicao. */
  name: string;
  /** Preco que o cliente tinha na cotacao. */
  quotedPrice: EthAmount;
  /** Preco atual no servidor. */
  currentPrice: EthAmount;
  /** Quantidade pedida. */
  requestedQuantity: Quantity;
  /** Unidades ainda disponiveis na edicao. */
  availableQuantity: Quantity;
  /** Versao atual do recurso — a mesma que chega por `nft.updated`. */
  version: number;
}

/** Corpo padronizado de uma resposta de erro da API. */
export interface ApiErrorPayload {
  /** Codigo estavel, usado para decidir o tratamento na interface. */
  code: ApiErrorCode;
  /** Mensagem legivel, ja em portugues, pronta para exibicao. */
  message: string;
  /** Subtipo do erro, quando existe (ver `ApiErrorReason`). */
  reason?: ApiErrorReason;
  /** Erros por campo, quando `code` for `VALIDATION_ERROR`. */
  fieldErrors?: Record<string, string>;
  /** Itens divergentes, quando o conflito e de preco/disponibilidade. */
  conflicts?: AvailabilityConflict[];
}

/** Parametros de paginacao aceitos pelos recursos listaveis. */
export interface PageParams {
  page: number;
  pageSize: number;
}

/** Envelope de listagem paginada usado pelos recursos de catalogo. */
export interface Paginated<TItem> {
  items: TItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Resposta da sonda de saude — usada desde a Fase 0 para provar que a cadeia
 * Axios -> MSW -> TanStack Query esta ligada de ponta a ponta.
 */
export interface HealthResponse {
  status: 'ok';
  /** Cenario de mocks ativo no momento da resposta. */
  scenario: string;
  /** Momento da resposta em ISO 8601. */
  timestamp: IsoDateTime;
}

/** Recurso versionado: permite descartar eventos antigos vindos do socket. */
export interface Versioned {
  /** Identificador estavel do recurso. */
  id: string;
  /** Versao monotonica incrementada a cada alteracao no servidor simulado. */
  version: number;
}
