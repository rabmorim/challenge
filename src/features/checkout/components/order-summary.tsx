import { Button } from '@/components/ui/button';
import { CouponDisclosure } from '@/features/checkout/components/coupon-disclosure';
import { OrderStatusNotice } from '@/features/checkout/components/order-status-notice';
import { OrderSummaryLine } from '@/features/checkout/components/order-summary-line';
import { StaleQuoteNotice } from '@/features/checkout/components/stale-quote-notice';
import { SummaryValues } from '@/features/checkout/components/summary-values';
import { WalletConnection } from '@/features/checkout/components/wallet-connection';
import { WalletProviderPicker } from '@/features/checkout/components/wallet-provider-picker';
import { CHECKOUT_COPY } from '@/features/checkout/constants/checkout-copy';
import type { OrderSummaryProps } from '@/features/checkout/types/checkout-components';

/**
 * "Seus NFTs" — a coluna direita do frame de 1440.
 *
 * Reúne, na ordem do frame: as linhas compradas, a chamada do cupom, os valores
 * da cotação, o bloco "Carteira e rede" e o CTA. Os avisos que o Figma não
 * desenha (bloqueio por cotação desatualizada e estado do pedido) entram **logo
 * antes do CTA**, que é onde eles importam: é o botão que eles explicam.
 *
 * O rótulo do CTA acompanha a fase do pedido — "Confirmar compra", "Enviando
 * pedido…" e "Aguardando a simulação…" —, porque um botão travado sem texto
 * novo não diz o que está acontecendo.
 *
 * @param props - Itens, cotação, carteiras, portão e estado do pedido.
 */
export function OrderSummary({ items, quote, wallets, order, gate, canSubmit }: OrderSummaryProps) {
  const isLocked = order.isSubmitting || order.phase === 'pending';

  const submitLabel = order.isSubmitting
    ? CHECKOUT_COPY.submitting
    : order.phase === 'pending'
      ? CHECKOUT_COPY.awaitingPayment
      : CHECKOUT_COPY.submit;

  return (
    <section data-testid="checkout-summary" aria-label={CHECKOUT_COPY.summaryTitle} className="flex flex-col gap-4">
      <h2 className="text-body-lg font-bold">{CHECKOUT_COPY.summaryTitle}</h2>

      <div className="border-divider text-body-lg flex items-center justify-between border-b pb-2">
        <span>{CHECKOUT_COPY.summaryItemsHeader}</span>
        <span>{CHECKOUT_COPY.summarySubtotalHeader}</span>
      </div>

      <ul className="flex flex-col gap-2.5">
        {items.map((item) => (
          <OrderSummaryLine
            key={item.id}
            name={item.name}
            tokenId={item.tokenId}
            imageUrl={item.imageUrl}
            imageAlt={item.imageAlt}
            quantity={item.quantity}
            lineTotal={item.lineTotal}
          />
        ))}
      </ul>

      <CouponDisclosure quote={quote} />

      <SummaryValues quote={quote} />

      <div className="border-divider flex flex-col gap-3 border-t pt-4">
        <h3 className="text-body-lg text-center font-bold">{CHECKOUT_COPY.walletBlockTitle}</h3>
        <WalletProviderPicker wallets={wallets} variant="sidebar" disabled={isLocked} />
        <WalletConnection wallets={wallets} disabled={isLocked} />
      </div>

      <StaleQuoteNotice gate={gate} />
      <OrderStatusNotice order={order} />

      <Button
        data-testid="checkout-submit"
        disabled={!canSubmit}
        onClick={order.submit}
        className="w-full"
      >
        {submitLabel}
      </Button>
    </section>
  );
}
