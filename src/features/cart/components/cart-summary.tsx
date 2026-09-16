import { Link } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { CouponForm } from '@/features/cart/components/coupon-form';
import { SummaryRow } from '@/components/summary-row';
import { CART_SUMMARY_COPY } from '@/features/cart/constants/cart-copy';
import type { CartSummaryProps } from '@/features/cart/types/cart-components';
import { formatEthPrecise } from '@/lib/eth';
import { cn } from '@/lib/utils';

/**
 * Resumo de valores — a sidebar de 1440 e o painel de rodapé de 414.
 *
 * **Todos os números vêm da cotação da API.** Subtotal, desconto do lançamento,
 * taxa de rede e total são exibidos como o servidor os devolveu, em string
 * decimal; não há uma soma sequer neste arquivo. Por isso a taxa vem com a nota
 * "Taxa estimada": a rede definitiva é escolhida no pagamento.
 *
 * Durante a recotagem (mudou a quantidade, chegou um `nft.updated`) os valores
 * anteriores **continuam na tela**, com `aria-busy` e contraste reduzido, em vez
 * de virarem esqueleto — trocar números por blocos cinzas a cada clique no "+"
 * seria uma piscada, não um progresso, e deslocaria a coluna inteira.
 *
 * @param props - Estado da cotação, variante, ação do CTA e carga do carrinho.
 */
export function CartSummary({ quote, variant, onCheckout, isCartPending }: CartSummaryProps) {
  const isPanel = variant === 'panel';
  const { quote: data } = quote;

  return (
    <section
      data-testid="cart-summary"
      aria-label={CART_SUMMARY_COPY.title}
      aria-busy={quote.isUpdating || undefined}
      className={cn(
        'flex flex-col',
        isPanel ? 'surface-gradient rounded-t-[40px] gap-5 px-6 pt-6 pb-8' : 'gap-6',
      )}
    >
      {!isPanel && (
        <h2 className="border-divider text-body-lg border-b pb-2.5 font-bold">
          {CART_SUMMARY_COPY.title}
        </h2>
      )}

      <CouponForm quote={quote} variant={variant} />

      {quote.isError && !quote.couponError ? (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-tan text-body">{quote.error?.message ?? CART_SUMMARY_COPY.errorTitle}</p>
          <Button variant="outline" size="sm" onClick={quote.refetch}>
            {CART_SUMMARY_COPY.errorRetry}
          </Button>
        </div>
      ) : (
        <dl
          data-testid="summary-values"
          className={cn(
            'flex flex-col gap-4 transition-opacity',
            quote.isUpdating && 'opacity-60',
          )}
        >
          <SummaryRow
            label={CART_SUMMARY_COPY.subtotal}
            value={data ? formatEthPrecise(data.subtotal) : CART_SUMMARY_COPY.noDiscount}
          />
          <SummaryRow
            label={CART_SUMMARY_COPY.discount}
            value={
              data && data.coupon
                ? CART_SUMMARY_COPY.discountValue(formatEthPrecise(data.discount))
                : CART_SUMMARY_COPY.noDiscount
            }
          />
          <SummaryRow
            label={CART_SUMMARY_COPY.networkFee}
            value={data ? formatEthPrecise(data.networkFee) : CART_SUMMARY_COPY.noDiscount}
            note={CART_SUMMARY_COPY.networkFeeNote}
          />
          <SummaryRow
            label={CART_SUMMARY_COPY.total}
            value={data ? formatEthPrecise(data.total) : CART_SUMMARY_COPY.noDiscount}
            isTotal
          />
        </dl>
      )}

      <Button
        data-testid="cart-checkout"
        disabled={isCartPending || !data}
        onClick={onCheckout}
        className={cn('w-full', isPanel && 'accent-gradient rounded-full py-5 text-[16px]')}
      >
        {CART_SUMMARY_COPY.checkout}
      </Button>

      {!isPanel && (
        <Button asChild variant="link" size="inline" className="mx-auto">
          <Link to={ROUTES.marketplace}>{CART_SUMMARY_COPY.keepExploring}</Link>
        </Button>
      )}
    </section>
  );
}
