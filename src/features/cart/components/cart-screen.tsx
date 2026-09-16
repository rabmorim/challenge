import { useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';

import { LiveRegion } from '@/components/live-region';
import { ROUTES } from '@/constants/routes';
import { AlsoViewed } from '@/features/cart/components/also-viewed';
import { CartBreadcrumb } from '@/features/cart/components/cart-breadcrumb';
import { CartCardList } from '@/features/cart/components/cart-card-list';
import { CartEmpty } from '@/features/cart/components/cart-empty';
import { CartFocusAnchor } from '@/features/cart/components/cart-focus-anchor';
import { CartError } from '@/features/cart/components/cart-error';
import { CartMobileHeader } from '@/features/cart/components/cart-mobile-header';
import { CartCardsSkeleton } from '@/features/cart/components/cart-cards-skeleton';
import { CartSummary } from '@/features/cart/components/cart-summary';
import { CartSummarySkeleton } from '@/features/cart/components/cart-summary-skeleton';
import { CartTable } from '@/features/cart/components/cart-table';
import { CART_COPY } from '@/features/cart/constants/cart-copy';
import { useAlsoViewed } from '@/features/cart/hooks/use-also-viewed';
import { useCart } from '@/features/cart/hooks/use-cart';
import { useCartMutations } from '@/features/cart/hooks/use-cart-mutations';
import { useCartRealtime } from '@/features/cart/hooks/use-cart-realtime';
import { useQuoteSummary } from '@/features/checkout/hooks/use-quote-summary';
import type { CartItem } from '@/features/cart/types/cart';
import { useCompactLayout } from '@/hooks/use-compact-layout';
import { useLiveAnnouncer } from '@/hooks/use-live-announcer';
import type { Quantity } from '@/types/api';

/**
 * Tela do carrinho.
 *
 * Concentra os hooks e reparte o resto em componentes pequenos. As decisões que
 * moram aqui, e em nenhum lugar abaixo:
 *
 * - **duas composições, não duas aparências.** O frame de 1440 é uma tabela com
 *   resumo ao lado; o de 414 é uma lista de cards com o resumo num painel de
 *   rodapé. Montar as duas e esconder uma com `md:hidden` duplicaria a árvore —
 *   dois seletores de quantidade e duas lixeiras por item, com rótulos
 *   repetidos para o leitor de tela. A escolha acontece antes de renderizar.
 * - **uma região viva só.** Mutations e `nft.updated` falam pelo mesmo
 *   anunciador (ver `useLiveAnnouncer`).
 * - **o resumo segue o carrinho.** `useQuoteSummary` recebe as linhas e a cotação
 *   se refaz sozinha quando elas mudam — inclusive por evento de tempo real.
 * - **a disponibilidade que cai vira mutation.** O tempo real avisa; quem apara
 *   a quantidade é a mesma ação que o "−" usa, para o servidor ter a palavra
 *   final em qualquer caminho.
 */
export function CartScreen() {
  const cart = useCart();
  const announcer = useLiveAnnouncer();
  const actions = useCartMutations(announcer.announce);
  const quote = useQuoteSummary(cart.items, { owner: cart.owner, network: null });
  const alsoViewed = useAlsoViewed(cart.items);
  const isCompact = useCompactLayout();
  const navigate = useNavigate();

  const { setQuantity } = actions;

  const handleAvailabilityDrop = useCallback(
    (item: CartItem, quantity: Quantity) => {
      setQuantity(item, quantity, { silent: true });
    },
    [setQuantity],
  );

  useCartRealtime({
    announce: announcer.announce,
    onAvailabilityDrop: handleAvailabilityDrop,
  });

  /**
   * "Conectar e finalizar".
   *
   * Não há gate escrito aqui: o pagamento é rota privada, então o visitante cai
   * no guard da Fase 2 (`/?auth=entrar&redirect=/pagamento`) e volta para cá
   * depois de entrar, já com o carrinho de visitante mesclado à conta pelo
   * servidor. Um `if (!isAuthenticated)` neste arquivo seria uma segunda
   * implementação da mesma regra, livre para divergir da que protege a rota.
   */
  const goToCheckout = useCallback(() => {
    void navigate({ to: ROUTES.checkout });
  }, [navigate]);

  const variant = isCompact ? 'panel' : 'sidebar';

  // O esqueleto cobre os dois primeiros carregamentos — o das linhas e o da
  // primeira cotação —, porque até a cotação chegar não existe resumo nenhum a
  // mostrar. Da segunda em diante quem manda é `isUpdating`, dentro do resumo.
  const summary =
    cart.isPending || quote.isPending ? (
      <CartSummarySkeleton variant={variant} />
    ) : (
      <CartSummary
        quote={quote}
        variant={variant}
        onCheckout={goToCheckout}
        isCartPending={cart.isPending}
      />
    );

  if (cart.isError) {
    return (
      <div className="mx-auto max-w-(--container-page) px-6 py-6 xl:px-0">
        <CartError
          message={cart.error?.message ?? CART_COPY.errorFallback}
          onRetry={cart.refetch}
        />
      </div>
    );
  }

  if (isCompact) {
    return (
      <div data-testid="cart-mobile" className="flex flex-col">
        {/* O frame emenda o painel de resumo no último card: o respiro aqui é
            só o que separa a lista da borda arredondada do painel. */}
        <div className="flex flex-col gap-5 px-4 pt-6 pb-1.5 min-[414px]:px-7">
          <CartMobileHeader />
          <LiveRegion testId="cart-live-region" message={announcer.message} />
          <CartFocusAnchor />

          {cart.isPending ? (
            <CartCardsSkeleton />
          ) : cart.isEmpty ? (
            <CartEmpty />
          ) : (
            <CartCardList items={cart.items} actions={actions} />
          )}
        </div>

        {!cart.isEmpty && summary}
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-(--container-page) flex-col gap-24 px-6 pt-12 pb-16 xl:px-0">
      <div className="flex flex-col gap-3">
        {/* O frame de 1440 abre na trilha, sem título — mas uma página sem `h1`
            deixa quem navega por marcos sem o nome da tela. O título existe só
            para o leitor de tela; o frame de 414 o desenha (`CartMobileHeader`). */}
        <h1 className="sr-only">{CART_COPY.title}</h1>
        <CartBreadcrumb />
        <LiveRegion testId="cart-live-region" message={announcer.message} />
        <CartFocusAnchor />

        {cart.isEmpty ? (
          <CartEmpty />
        ) : (
          /* `items-start` para a tabela não ser esticada até a altura do
             resumo: em `stretch`, as linhas absorveriam a sobra e cresceriam
             além dos 70px do frame. */
          <div className="grid grid-cols-[minmax(0,1fr)_332px] items-start gap-x-[86px]">
            <CartTable items={cart.items} actions={actions} isPending={cart.isPending} />

            {summary}
          </div>
        )}
      </div>

      <AlsoViewed items={alsoViewed.items} isPending={alsoViewed.isPending} />
    </div>
  );
}
