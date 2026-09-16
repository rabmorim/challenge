import { ChevronLeftIcon } from 'lucide-react';
import { useState } from 'react';

import { LiveRegion } from '@/components/live-region';
import { Button } from '@/components/ui/button';
import { CheckoutDisclosure } from '@/features/checkout/components/checkout-disclosure';
import { CollectorForm } from '@/features/checkout/components/collector-form';
import { ConnectedWallets } from '@/features/checkout/components/connected-wallets';
import { CouponDisclosure } from '@/features/checkout/components/coupon-disclosure';
import { OrderStatusNotice } from '@/features/checkout/components/order-status-notice';
import { OrderSummaryLine } from '@/features/checkout/components/order-summary-line';
import { OrderSummarySkeleton } from '@/features/checkout/components/order-summary-skeleton';
import { StaleQuoteNotice } from '@/features/checkout/components/stale-quote-notice';
import { SummaryValues } from '@/features/checkout/components/summary-values';
import { WalletProviderPicker } from '@/features/checkout/components/wallet-provider-picker';
import { CHECKOUT_COPY, WALLET_COPY } from '@/features/checkout/constants/checkout-copy';
import { useCollectorDisclosure } from '@/features/checkout/hooks/use-collector-disclosure';
import type { CheckoutMobileProps } from '@/features/checkout/types/checkout-components';
import { formatEthPrecise } from '@/lib/eth';

/**
 * Composição de 414 — a tela "Pagamento com carteira" do frame.
 *
 * O Figma traz **um** frame mobile de pagamento, e ele desenha só carteira,
 * rede e total, com o CTA no rodapé. Os campos do colecionador não aparecem
 * nele, mas também não podem sumir do celular: são obrigatórios e validados
 * pelo servidor. Empilhá-los acima das carteiras desfiguraria o frame, então
 * eles (e o resumo do pedido) descem para duas seções recolhidas, no espaço
 * vazio que o frame deixa entre o total e o "Confirmar compra".
 *
 * Por isso a tela é uma só, e não duas etapas: a primeira dobra é o frame, e
 * nada obrigatório fica escondido de quem precisa preencher — confirmar com
 * campo inválido abre a seção e leva o foco ao erro (`useCollectorDisclosure`).
 * O desvio está registrado no ARCHITECTURE.
 *
 * @param props - Estado da tela e a saída da seta de voltar.
 */
export function CheckoutMobile({ checkout, onBack }: CheckoutMobileProps) {
  const isSummaryPending = checkout.isCartPending || checkout.quote.isPending;
  const isLocked = checkout.order.isSubmitting || checkout.order.phase === 'pending';

  const collector = useCollectorDisclosure(checkout.form.validate);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  const { wallets } = checkout.wallets;
  const selectedIndex = wallets.findIndex((wallet) => wallet.id === checkout.wallets.selected?.id);
  const nextWallet = wallets.length > 1 ? wallets[(selectedIndex + 1) % wallets.length] : null;

  const submitLabel = checkout.order.isSubmitting
    ? CHECKOUT_COPY.submitting
    : checkout.order.phase === 'pending'
      ? CHECKOUT_COPY.awaitingPayment
      : CHECKOUT_COPY.submit;

  return (
    <div
      data-testid="checkout-mobile"
      className="flex min-h-dvh flex-col gap-5 px-4 pt-6 pb-6 min-[414px]:px-7"
    >
      <div className="relative flex items-center justify-center">
        <button
          type="button"
          data-testid="checkout-back"
          aria-label={CHECKOUT_COPY.mobileBack}
          onClick={onBack}
          className="border-border bg-surface-lift text-tan absolute left-0 flex size-[35px] cursor-pointer items-center justify-center rounded-full border"
        >
          <ChevronLeftIcon className="size-5" aria-hidden="true" />
        </button>

        <h1 className="text-title text-center">{CHECKOUT_COPY.mobileTitle}</h1>
      </div>

      <LiveRegion
        testId="checkout-live-region"
        message={checkout.liveMessage}
        politeness="assertive"
      />

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-body-lg font-bold">{CHECKOUT_COPY.connectedWalletsTitle}</h2>
        {/* Atalho para o que os cartões abaixo já permitem: avança para a
            próxima carteira cadastrada. Com uma carteira só não há o que
            trocar, e o controle fica desabilitado em vez de não fazer nada. */}
        <Button
          variant="link"
          size="inline"
          data-testid="checkout-switch-wallet"
          disabled={isLocked || nextWallet === null}
          className="text-body"
          onClick={() => {
            if (nextWallet) checkout.wallets.select(nextWallet.id);
          }}
        >
          {CHECKOUT_COPY.switchWallet}
        </Button>
      </div>

      <ConnectedWallets wallets={checkout.wallets} disabled={isLocked} />

      {checkout.wallets.connectionError && (
        <p
          role="alert"
          data-testid="wallet-connection-error"
          className="text-destructive text-caption"
        >
          {checkout.wallets.connectionError.message}
        </p>
      )}

      <h2 className="text-body-lg font-bold">{WALLET_COPY.providerGroupLabel}</h2>
      <WalletProviderPicker wallets={checkout.wallets} variant="compact" disabled={isLocked} />

      <p className="text-body-lg flex items-center justify-end gap-3 font-bold">
        {CHECKOUT_COPY.mobileTotal}
        <span data-testid="checkout-mobile-total" className="text-primary">
          {checkout.quote.quote
            ? formatEthPrecise(checkout.quote.quote.total)
            : CHECKOUT_COPY.noValue}
        </span>
      </p>

      {/* As duas seções andam juntas, mais próximas entre si do que dos blocos
          do frame: é o vão que o Figma deixa entre o total e o CTA. */}
      <div className="flex flex-col gap-3">
        <CheckoutDisclosure
          title={CHECKOUT_COPY.collectorTitle}
          testId="checkout-collector-section"
          isOpen={collector.isOpen}
          onOpenChange={collector.setIsOpen}
          panelRef={collector.panelRef}
        >
          <CollectorForm form={checkout.form} isLocked={checkout.order.isSubmitting} />
        </CheckoutDisclosure>

        <CheckoutDisclosure
          title={CHECKOUT_COPY.summaryTitle}
          testId="checkout-summary-section"
          isOpen={isSummaryOpen}
          onOpenChange={setIsSummaryOpen}
        >
          {isSummaryPending ? (
            <OrderSummarySkeleton />
          ) : (
            <div className="flex flex-col gap-4">
              <ul className="flex flex-col gap-2.5">
                {checkout.items.map((item) => (
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

              <CouponDisclosure quote={checkout.quote} />
              <SummaryValues quote={checkout.quote} />
            </div>
          )}
        </CheckoutDisclosure>
      </div>

      <StaleQuoteNotice gate={checkout.gate} />
      <OrderStatusNotice order={checkout.order} />

      {/* A validação acontece aqui, e não só dentro de `submit`: sem isto, um
          campo inválido pararia o envio com os erros dentro de uma seção
          fechada — nada mudaria na tela. */}
      <Button
        data-testid="checkout-submit"
        disabled={!checkout.canSubmit}
        onClick={() => {
          if (collector.ensureValid()) checkout.order.submit();
        }}
        className="accent-gradient mt-auto w-full rounded-full py-5 text-[16px]"
      >
        {submitLabel}
      </Button>
    </div>
  );
}
