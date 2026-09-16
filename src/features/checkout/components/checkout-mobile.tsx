import { ChevronLeftIcon } from 'lucide-react';

import { LiveRegion } from '@/components/live-region';
import { Button } from '@/components/ui/button';
import { CollectorForm } from '@/features/checkout/components/collector-form';
import { ConnectedWallets } from '@/features/checkout/components/connected-wallets';
import { CouponDisclosure } from '@/features/checkout/components/coupon-disclosure';
import { OrderStatusNotice } from '@/features/checkout/components/order-status-notice';
import { OrderSummaryLine } from '@/features/checkout/components/order-summary-line';
import { OrderSummarySkeleton } from '@/features/checkout/components/order-summary-skeleton';
import { StaleQuoteNotice } from '@/features/checkout/components/stale-quote-notice';
import { SummaryValues } from '@/features/checkout/components/summary-values';
import { WalletProviderPicker } from '@/features/checkout/components/wallet-provider-picker';
import { CHECKOUT_STEPS } from '@/features/checkout/constants/checkout';
import { CHECKOUT_COPY, WALLET_COPY } from '@/features/checkout/constants/checkout-copy';
import type { CheckoutMobileProps } from '@/features/checkout/types/checkout-components';
import { formatEthPrecise } from '@/lib/eth';

/**
 * Composição de 414 — duas etapas.
 *
 * O Figma traz **um** frame mobile de pagamento, "Pagamento com carteira", e
 * ele não tem os campos do colecionador. Eles não podem simplesmente sumir no
 * celular (são obrigatórios e validados pelo servidor), e empilhá-los acima da
 * lista de carteiras desfiguraria o frame, que ocupa a tela inteira com o CTA
 * no rodapé.
 *
 * A saída é dividir em duas etapas na mesma rota: "dados" (versão responsiva do
 * formulário, sem frame no Figma) e "carteira" (o frame, fiel). A etapa vive na
 * URL, então sobrevive ao refresh e o "voltar" do navegador anda entre elas.
 * O desvio está registrado no ARCHITECTURE.
 *
 * @param props - Estado da tela, etapa corrente e a navegação entre etapas.
 */
export function CheckoutMobile({ checkout, step, onStepChange, onBack }: CheckoutMobileProps) {
  const isWalletStep = step === CHECKOUT_STEPS.wallet;
  const isSummaryPending = checkout.isCartPending || checkout.quote.isPending;
  const isLocked = checkout.order.isSubmitting || checkout.order.phase === 'pending';

  const { wallets } = checkout.wallets;
  const selectedIndex = wallets.findIndex((wallet) => wallet.id === checkout.wallets.selected?.id);
  const nextWallet = wallets.length > 1 ? wallets[(selectedIndex + 1) % wallets.length] : null;

  const submitLabel = checkout.order.isSubmitting
    ? CHECKOUT_COPY.submitting
    : checkout.order.phase === 'pending'
      ? CHECKOUT_COPY.awaitingPayment
      : CHECKOUT_COPY.submit;

  return (
    <div data-testid="checkout-mobile" className="flex min-h-dvh flex-col gap-5 px-4 pt-6 pb-8 min-[414px]:px-7">
      <div className="relative flex items-center justify-center">
        <button
          type="button"
          data-testid="checkout-back"
          aria-label={CHECKOUT_COPY.mobileBack}
          onClick={() => {
            if (isWalletStep) onStepChange(CHECKOUT_STEPS.details);
            else onBack();
          }}
          className="border-border bg-surface-lift text-tan absolute left-0 flex size-[35px] cursor-pointer items-center justify-center rounded-full border"
        >
          <ChevronLeftIcon className="size-5" aria-hidden="true" />
        </button>

        <h1 className="text-title text-center">
          {isWalletStep ? CHECKOUT_COPY.mobileTitle : CHECKOUT_COPY.collectorTitle}
        </h1>
      </div>

      <LiveRegion testId="checkout-live-region" message={checkout.liveMessage} politeness="assertive" />

      {isWalletStep ? (
        <>
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
            <p role="alert" data-testid="wallet-connection-error" className="text-destructive text-caption">
              {checkout.wallets.connectionError.message}
            </p>
          )}

          <h2 className="text-body-lg font-bold">{WALLET_COPY.providerGroupLabel}</h2>
          <WalletProviderPicker wallets={checkout.wallets} variant="compact" disabled={isLocked} />

          <p className="text-body-lg flex items-center justify-end gap-3 font-bold">
            {CHECKOUT_COPY.mobileTotal}
            <span data-testid="checkout-mobile-total" className="text-primary">
              {checkout.quote.quote ? formatEthPrecise(checkout.quote.quote.total) : CHECKOUT_COPY.noValue}
            </span>
          </p>

          <StaleQuoteNotice gate={checkout.gate} />
          <OrderStatusNotice order={checkout.order} />

          <Button
            data-testid="checkout-submit"
            disabled={!checkout.canSubmit}
            onClick={checkout.order.submit}
            className="accent-gradient mt-auto w-full rounded-full py-5 text-[16px]"
          >
            {submitLabel}
          </Button>
        </>
      ) : (
        <>
          <CollectorForm form={checkout.form} isLocked={checkout.order.isSubmitting} />

          {isSummaryPending ? (
            <OrderSummarySkeleton />
          ) : (
            <section aria-label={CHECKOUT_COPY.summaryTitle} className="flex flex-col gap-4">
              <h2 className="text-body-lg font-bold">{CHECKOUT_COPY.summaryTitle}</h2>

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
            </section>
          )}

          {/* O bloqueio acompanha o usuário: ele pode chegar em qualquer etapa,
              e esconder o aviso na primeira deixaria a compra travada adiante
              sem explicação. */}
          <StaleQuoteNotice gate={checkout.gate} />

          {/* Avançar valida antes: a etapa seguinte não mostra o formulário,
              então deixar passar com campo inválido esconderia o erro de quem
              precisa corrigi-lo. */}
          <Button
            data-testid="checkout-continue"
            className="accent-gradient mt-auto w-full rounded-full py-5 text-[16px]"
            onClick={() => {
              if (checkout.form.validate()) onStepChange(CHECKOUT_STEPS.wallet);
            }}
          >
            {CHECKOUT_COPY.continueToWallet}
          </Button>
        </>
      )}
    </div>
  );
}
