import { toOptionalText } from '@/features/checkout/lib/collector-validation';
import type { CreateOrderRequest } from '@/features/checkout/types/order';
import type { CollectorFormValues } from '@/features/checkout/types/checkout-state';
import type { Quote } from '@/features/checkout/types/quote';

/**
 * Monta o corpo de `POST /orders`.
 *
 * A cotacao entra inteira (`quoteId` + `pricingSignature` + as linhas dela, nao
 * as do carrinho): e o que permite ao servidor revalidar preco, disponibilidade,
 * cupom e taxas contra o catalogo atual antes de aceitar. Montar os itens a
 * partir do carrinho abriria a porta para enviar uma combinacao que a cotacao
 * nunca viu — e o servidor recusaria com `QUOTE_STALE`, corretamente.
 *
 * O corpo tambem e a identidade da tentativa: a impressao digital dele decide
 * se a chave de idempotencia e reaproveitada (ver `useCheckoutAttempt`). Por
 * isso os campos opcionais sao normalizados aqui — `""` e `null` descrevem a
 * mesma ausencia, e alternar entre os dois rotacionaria a chave a toa.
 *
 * @param quote - Cotacao vigente, aceita pelo usuario.
 * @param values - Valores do formulario do colecionador.
 * @param walletId - Carteira escolhida para pagar.
 * @returns Corpo pronto para a criacao do pedido.
 */
export function buildOrderRequest(
  quote: Quote,
  values: CollectorFormValues,
  walletId: string,
): CreateOrderRequest {
  return {
    quoteId: quote.id,
    pricingSignature: quote.pricingSignature,
    items: quote.lines.map((line) => ({ nftId: line.nftId, quantity: line.quantity })),
    couponCode: quote.coupon?.code ?? null,
    network: quote.network,
    walletId,
    collector: {
      displayName: values.displayName.trim(),
      username: values.username.trim(),
      profileName: values.profileName.trim(),
      email: values.email.trim(),
      walletAddress: values.walletAddress.trim(),
      secondaryWallet: toOptionalText(values.secondaryWallet),
      referralCode: values.referralCode.trim(),
      ensDomain: values.ensDomain,
      usesAlternateWallet: values.usesAlternateWallet,
      note: toOptionalText(values.note),
    },
  };
}
