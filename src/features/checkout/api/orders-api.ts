import { API_PATHS, IDEMPOTENCY_KEY_HEADER } from '@/constants/api';
import type {
  CreateOrderRequest,
  Order,
  OrderReceipt,
  OrdersListResponse,
} from '@/features/checkout/types/order';
import { httpClient } from '@/lib/http';

/**
 * Chamadas REST de pedido.
 *
 * A criacao e idempotente: a chave viaja no cabecalho `x-idempotency-key` e o
 * mesmo par (chave + corpo) recupera o mesmo pedido — e o que protege contra
 * clique repetido e contra reenvio depois de timeout. Reusar a chave com corpo
 * diferente e conflito.
 */

/**
 * Gera uma chave de idempotencia para uma tentativa de compra.
 * A mesma chave deve ser reaproveitada em todas as retentativas da MESMA
 * tentativa (inclusive depois de timeout).
 *
 * @returns Chave unica.
 */
export function createIdempotencyKey(): string {
  return globalThis.crypto.randomUUID();
}

/**
 * Cria o pedido a partir de uma cotacao.
 *
 * @param body - Cotacao, itens, carteira, rede e dados do colecionador.
 * @param idempotencyKey - Chave da tentativa (ver `createIdempotencyKey`).
 * @returns Pedido criado (ou o pedido recuperado pela chave).
 * @throws {NormalizedHttpError} `CONFLICT` com `PRICE_CHANGED`,
 *   `EDITION_SOLD_OUT`, `QUOTE_STALE`, `QUOTE_EXPIRED` ou
 *   `IDEMPOTENCY_KEY_REUSED`; `VALIDATION_ERROR` nos dados do formulario.
 */
export async function createOrder(
  body: CreateOrderRequest,
  idempotencyKey: string,
): Promise<Order> {
  const { data } = await httpClient.post<Order>(API_PATHS.orders, body, {
    headers: { [IDEMPOTENCY_KEY_HEADER]: idempotencyKey },
  });
  return data;
}

/**
 * Lista os pedidos do usuario autenticado.
 *
 * @param signal - `AbortSignal` do TanStack Query.
 * @returns Pedidos do mais recente para o mais antigo.
 */
export async function fetchOrders(signal?: AbortSignal): Promise<OrdersListResponse> {
  const { data } = await httpClient.get<OrdersListResponse>(API_PATHS.orders, signal ? { signal } : undefined);
  return data;
}

/**
 * Consulta o estado de um pedido.
 * E o caminho de recuperacao depois de refresh ou reconexao: o estado vem do
 * servidor, nunca de otimismo local.
 *
 * @param orderId - Id do pedido.
 * @param signal - `AbortSignal` do TanStack Query.
 * @returns Pedido com o estado atual.
 * @throws {NormalizedHttpError} `NOT_FOUND` quando o pedido nao e do usuario.
 */
export async function fetchOrder(orderId: string, signal?: AbortSignal): Promise<Order> {
  const { data } = await httpClient.get<Order>(API_PATHS.orderById(orderId), signal ? { signal } : undefined);
  return data;
}

/**
 * Consulta o recibo (snapshot imutavel) de um pedido em estado terminal.
 *
 * @param orderId - Id do pedido.
 * @param signal - `AbortSignal` do TanStack Query.
 * @returns Recibo do pedido.
 * @throws {NormalizedHttpError} `NOT_FOUND` enquanto o pedido esta pendente.
 */
export async function fetchOrderReceipt(
  orderId: string,
  signal?: AbortSignal,
): Promise<OrderReceipt> {
  const { data } = await httpClient.get<OrderReceipt>(API_PATHS.orderReceipt(orderId), signal ? { signal } : undefined);
  return data;
}
