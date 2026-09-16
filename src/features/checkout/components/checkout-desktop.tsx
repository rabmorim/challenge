import { LiveRegion } from '@/components/live-region';
import { CheckoutBreadcrumb } from '@/features/checkout/components/checkout-breadcrumb';
import { CollectorForm } from '@/features/checkout/components/collector-form';
import { OrderSummary } from '@/features/checkout/components/order-summary';
import { OrderSummarySkeleton } from '@/features/checkout/components/order-summary-skeleton';
import { CHECKOUT_COPY } from '@/features/checkout/constants/checkout-copy';
import type { CheckoutLayoutProps } from '@/features/checkout/types/checkout-components';

/**
 * Composição de 1440: formulário à esquerda, resumo à direita.
 *
 * A grade é a do frame — 763px de formulário e 405px de resumo, com 32px entre
 * eles —, e `items-start` impede que a coluna do formulário seja esticada até a
 * altura do resumo.
 *
 * O esqueleto cobre os dois primeiros carregamentos (as linhas e a primeira
 * cotação), porque até a cotação chegar não existe resumo nenhum a mostrar. Da
 * segunda em diante quem manda é `isUpdating`, dentro do resumo, que mantém os
 * valores anteriores na tela.
 *
 * @param props - Estado inteiro da tela.
 */
export function CheckoutDesktop({ checkout }: CheckoutLayoutProps) {
  const isSummaryPending = checkout.isCartPending || checkout.quote.isPending;

  return (
    <div className="mx-auto flex max-w-(--container-page) flex-col gap-8 px-6 pt-8 pb-16 xl:px-0">
      <CheckoutBreadcrumb />
      <LiveRegion testId="checkout-live-region" message={checkout.liveMessage} politeness="assertive" />

      <div className="grid grid-cols-[minmax(0,1fr)_405px] items-start gap-8">
        <section aria-label={CHECKOUT_COPY.collectorTitle} className="flex flex-col gap-4">
          <h2 className="text-body-lg font-bold">{CHECKOUT_COPY.collectorTitle}</h2>
          <CollectorForm form={checkout.form} isLocked={checkout.order.isSubmitting} />
        </section>

        {isSummaryPending ? (
          <OrderSummarySkeleton />
        ) : (
          <OrderSummary
            items={checkout.items}
            quote={checkout.quote}
            wallets={checkout.wallets}
            order={checkout.order}
            gate={checkout.gate}
            canSubmit={checkout.canSubmit}
          />
        )}
      </div>
    </div>
  );
}
