import { Link } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { CheckoutDesktop } from '@/features/checkout/components/checkout-desktop';
import { CheckoutMobile } from '@/features/checkout/components/checkout-mobile';
import { ReceiptDialog } from '@/features/checkout/components/receipt-dialog';
import { CHECKOUT_COPY } from '@/features/checkout/constants/checkout-copy';
import { useCheckout } from '@/features/checkout/hooks/use-checkout';
import { useBackNavigation } from '@/hooks/use-back-navigation';
import { useCompactLayout } from '@/hooks/use-compact-layout';

/**
 * Tela de pagamento.
 *
 * Monta o estado uma vez (`useCheckout`) e escolhe a composição **antes** de
 * renderizar: o frame de 1440 é formulário e resumo lado a lado, o de 414 é a
 * tela da carteira com as duas seções recolhidas. Montar as duas e esconder uma
 * com `md:hidden` duplicaria a árvore — dois formulários com os mesmos ids,
 * dois grupos de radio de carteira, dois botões "Confirmar compra" para o
 * leitor de tela.
 *
 * O recibo fica **fora** das composições e é renderizado em qualquer estado da
 * página. Não é detalhe de organização: o pedido confirmado esvazia o carrinho,
 * e se o recibo morasse dentro da composição, a confirmação o desmontaria no
 * mesmo instante em que ele deveria aparecer.
 *
 * Pela mesma razão, o carrinho vazio só vira estado vazio quando **não há
 * pedido em curso**. Vazio aqui não é erro: alguém pode chegar por URL, ou ter
 * acabado de comprar tudo — e a saída é o mercado.
 */
export function CheckoutScreen() {
  const checkout = useCheckout();
  const isCompact = useCompactLayout();
  const back = useBackNavigation();

  const hasOrder = checkout.order.phase !== 'idle';

  /**
   * Corpo da página, escolhido pelo estado do carrinho e pela faixa da tela.
   *
   * @returns Composição a renderizar sob o recibo.
   */
  const renderBody = () => {
    if (checkout.cartError) {
      return (
        <div className="mx-auto flex max-w-(--container-page) flex-col items-start gap-4 px-6 py-16 xl:px-0">
          <p role="alert" className="text-tan text-body">
            {checkout.cartError.message}
          </p>
          <Button variant="outline" size="sm" onClick={checkout.refetchCart}>
            {CHECKOUT_COPY.errorRetry}
          </Button>
        </div>
      );
    }

    if (!checkout.isCartPending && checkout.isCartEmpty && !hasOrder) {
      return (
        <div
          data-testid="checkout-empty"
          className="mx-auto flex max-w-(--container-page) flex-col items-start gap-4 px-6 py-16 xl:px-0"
        >
          <h1 className="text-heading">{CHECKOUT_COPY.emptyTitle}</h1>
          <p className="text-tan text-body max-w-prose">{CHECKOUT_COPY.emptyDescription}</p>
          <Button asChild>
            <Link to={ROUTES.marketplace}>{CHECKOUT_COPY.emptyAction}</Link>
          </Button>
        </div>
      );
    }

    return isCompact ? (
      <CheckoutMobile checkout={checkout} onBack={back.goBack} />
    ) : (
      <CheckoutDesktop checkout={checkout} />
    );
  };

  return (
    <>
      {renderBody()}

      <ReceiptDialog
        receipt={checkout.order.receipt}
        isOpen={checkout.order.phase === 'confirmed' && checkout.order.receipt !== null}
        onClose={checkout.order.dismissReceipt}
      />
    </>
  );
}
