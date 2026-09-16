import { useCallback } from 'react';

import { useSession } from '@/features/auth/hooks/use-session';
import { useCart } from '@/features/cart/hooks/use-cart';
import { useCheckoutGate } from '@/features/checkout/hooks/use-checkout-gate';
import { useCollectorForm } from '@/features/checkout/hooks/use-collector-form';
import { useOrderSubmit } from '@/features/checkout/hooks/use-order-submit';
import { useQuoteSummary } from '@/features/checkout/hooks/use-quote-summary';
import { useWalletSelection } from '@/features/checkout/hooks/use-wallet-selection';
import type { CheckoutScreenState } from '@/features/checkout/types/checkout-state';
import { useLiveAnnouncer } from '@/hooks/use-live-announcer';
import { DEFAULT_CHECKOUT_NETWORK } from '@/constants/network';

/**
 * Estado inteiro da tela de pagamento.
 *
 * A tela e a composicao de cinco responsabilidades separadas, e a ordem em que
 * elas se encadeiam e a propria regra de negocio:
 *
 * 1. **carteiras** — o que o usuario tem cadastrado (recurso so lido aqui);
 * 2. **formulario** — preenchido a partir da conta e da carteira escolhida; e
 *    dele que sai a REDE, porque e a rede que define a taxa;
 * 3. **cotacao** — recalculada pelo servidor sempre que itens, cupom ou rede
 *    mudam; nenhum valor e somado no cliente;
 * 4. **portao** — impede confirmar com uma cotacao que o servidor ja nao honra;
 * 5. **pedido** — envia com chave de idempotencia e acompanha ate o estado
 *    terminal, que so a simulacao pode decidir.
 *
 * Uma unica regiao viva atende as cinco (ver `useLiveAnnouncer`): duas regioes
 * concorrentes fariam o leitor de tela cortar um anuncio no meio do outro.
 *
 * @returns Estado e acoes que as duas composicoes (1440 e 414) consomem.
 */
export function useCheckout(): CheckoutScreenState {
  const { user } = useSession();
  const userId = user?.id ?? '';

  const cart = useCart();
  const announcer = useLiveAnnouncer();
  const wallets = useWalletSelection(userId, announcer.announce);
  const form = useCollectorForm(user, wallets.selected, DEFAULT_CHECKOUT_NETWORK);

  const quote = useQuoteSummary(cart.items, { owner: userId, network: form.values.network });

  const refreshPricing = useCallback(() => {
    cart.refetch();
    quote.refetch();
  }, [cart, quote]);

  const gate = useCheckoutGate({
    items: cart.items,
    quote: quote.quote,
    isRefreshing: quote.isUpdating,
    announce: announcer.announce,
    onStale: refreshPricing,
  });

  const order = useOrderSubmit({
    userId,
    quote: quote.quote,
    form,
    wallets,
    gate,
    announce: announcer.announce,
  });

  // Enquanto o pedido existe, o botao nao pode reenviar: quem resolve dali em
  // diante e a simulacao (pendente) ou a acao propria de cada desfecho.
  const isAwaitingOutcome =
    order.phase === 'pending' || order.phase === 'confirmed' || order.phase === 'declined';

  const canSubmit =
    !order.isSubmitting &&
    !isAwaitingOutcome &&
    gate.block === null &&
    quote.quote !== null &&
    !quote.isUpdating &&
    wallets.selected?.status === 'connected';

  return {
    items: cart.items,
    itemCount: cart.itemCount,
    isCartPending: cart.isPending,
    isCartEmpty: cart.isEmpty,
    cartError: cart.error,
    refetchCart: cart.refetch,
    quote,
    form,
    wallets,
    gate,
    order,
    liveMessage: announcer.message,
    canSubmit,
  };
}
