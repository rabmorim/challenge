import { Link } from '@tanstack/react-router';

import { AppIcon } from '@/components/app-icon';
import { ROUTES } from '@/constants/routes';
import { CART_COPY } from '@/features/cart/constants/cart-copy';
import { useCartCount } from '@/features/cart/hooks/use-cart-count';

/**
 * Ícone de carrinho com a contagem, no header.
 *
 * Só leitura: a contagem vem da query do carrinho, que o servidor simulado já
 * calcula (`itemCount`). A tela do carrinho entra na fase dela — o link aponta
 * para a rota que a receberá, que hoje declara isso em vez de fingir um
 * carrinho vazio.
 */
export function CartBadge() {
  const { count, isPending } = useCartCount();

  return (
    <Link
      to={ROUTES.cart}
      aria-label={CART_COPY.badgeLabel(count)}
      className="text-foreground rounded-control relative flex size-9 items-center justify-center"
    >
      <AppIcon id="cart" />

      {!isPending && count > 0 && (
        <span
          data-testid="cart-count"
          className="bg-primary text-primary-foreground absolute top-0 right-0 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-4 font-bold"
        >
          {count}
        </span>
      )}
    </Link>
  );
}
