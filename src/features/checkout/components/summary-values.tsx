import { SummaryRow } from '@/components/summary-row';
import { CHECKOUT_COPY } from '@/features/checkout/constants/checkout-copy';
import type { SummaryValuesProps } from '@/features/checkout/types/checkout-components';
import { formatEthPrecise } from '@/lib/eth';
import { cn } from '@/lib/utils';

/**
 * Subtotal, desconto do lançamento, taxa de rede e total.
 *
 * **Todos os números vêm da cotação da API** — não há uma soma sequer neste
 * arquivo. A linha da taxa mantém a nota "Taxa estimada" do frame porque ela
 * é estimada mesmo: a taxa definitiva depende da rede, e trocar de rede produz
 * outra cotação.
 *
 * Durante a recotagem os valores anteriores continuam na tela, com `aria-busy`
 * e contraste reduzido, em vez de virarem esqueleto: trocar números por blocos
 * cinzas a cada atualização seria uma piscada, não um progresso.
 *
 * @param props - Estado da cotação.
 */
export function SummaryValues({ quote }: SummaryValuesProps) {
  const data = quote.quote;

  return (
    <dl
      data-testid="checkout-summary-values"
      aria-busy={quote.isUpdating || undefined}
      className={cn('flex flex-col gap-3.5 transition-opacity', quote.isUpdating && 'opacity-60')}
    >
      <SummaryRow
        label={CHECKOUT_COPY.subtotal}
        value={data ? formatEthPrecise(data.subtotal) : CHECKOUT_COPY.noValue}
      />
      <SummaryRow
        label={CHECKOUT_COPY.discount}
        value={
          data?.coupon ? `(-) ${formatEthPrecise(data.discount)}` : CHECKOUT_COPY.noValue
        }
      />
      <SummaryRow
        label={CHECKOUT_COPY.networkFee}
        value={data ? formatEthPrecise(data.networkFee) : CHECKOUT_COPY.noValue}
        note={CHECKOUT_COPY.networkFeeNote}
        noteAlign="center"
      />
      <SummaryRow
        label={CHECKOUT_COPY.total}
        value={data ? formatEthPrecise(data.total) : CHECKOUT_COPY.noValue}
        isTotal
      />
    </dl>
  );
}
