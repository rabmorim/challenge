import type { ApiErrorReason } from '@/types/api';
import { isHttpError } from '@/lib/http';

/**
 * Recusas do cupom vindas da cotacao.
 *
 * `COUPON_NOT_FOUND` (codigo inexistente), `COUPON_EXPIRED` (venceu) e
 * `COUPON_NOT_APPLICABLE` (subtotal minimo ou restricao de colecao) chegam com
 * o mesmo `code` das demais validacoes — e o `reason` que as separa. A distincao
 * importa porque a recusa do cupom pertence ao CAMPO, e nao ao resumo: ela vira
 * mensagem associada ao input, sem derrubar os valores que ja estavam na tela.
 */
const COUPON_FAILURE_REASONS: readonly ApiErrorReason[] = [
  'COUPON_NOT_FOUND',
  'COUPON_EXPIRED',
  'COUPON_NOT_APPLICABLE',
] as const;

/**
 * Extrai a mensagem de recusa do cupom.
 *
 * @param error - Erro capturado na cotacao (query ou mutation).
 * @returns Texto a exibir junto do campo, ou `null` quando o erro e outro.
 */
export function toCouponError(error: unknown): string | null {
  if (!isHttpError(error)) return null;
  if (!error.reason || !COUPON_FAILURE_REASONS.includes(error.reason)) return null;

  return error.fieldErrors?.couponCode ?? error.message;
}
