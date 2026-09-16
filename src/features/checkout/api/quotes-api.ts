import { API_PATHS } from '@/constants/api';
import type { Quote, QuoteRequest } from '@/features/checkout/types/quote';
import { httpClient } from '@/lib/http';

/**
 * Chamada REST da cotacao.
 *
 * A cotacao e a referencia dos valores da compra: subtotal, desconto, taxa de
 * rede e total vem prontos do servidor, como strings decimais. O cliente
 * guarda `id` e `pricingSignature` para reenviar na criacao do pedido.
 */

/**
 * Cotiza os itens, aplicando cupom e rede quando informados.
 *
 * @param body - Itens, cupom (ou `null` para remover) e rede escolhida.
 * @param signal - `AbortSignal` do TanStack Query.
 * @returns Cotacao com valores calculados pelo servidor.
 * @throws {NormalizedHttpError} `VALIDATION_ERROR` com `COUPON_NOT_FOUND` /
 *   `COUPON_EXPIRED` / `COUPON_NOT_APPLICABLE`, ou `CONFLICT` quando a
 *   disponibilidade mudou.
 */
export async function createQuote(body: QuoteRequest, signal?: AbortSignal): Promise<Quote> {
  const { data } = await httpClient.post<Quote>(
    API_PATHS.quotes,
    body,
    signal ? { signal } : undefined,
  );
  return data;
}
