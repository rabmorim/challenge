import { CartCard } from '@/features/cart/components/cart-card';
import { CART_COPY } from '@/features/cart/constants/cart-copy';
import type { CartItemsProps } from '@/features/cart/types/cart-components';

/**
 * Lista de itens do frame de 414.
 *
 * Uma lista de verdade (`ul`/`li`): o leitor de tela anuncia quantos itens há,
 * que é a informação que a tabela do frame de 1440 entrega pelos cabeçalhos.
 *
 * @param props - Linhas e as ações do carrinho.
 */
export function CartCardList({ items, actions }: Omit<CartItemsProps, 'isPending'>) {
  return (
    <ul data-testid="cart-card-list" aria-label={CART_COPY.title} className="flex flex-col gap-5">
      {items.map((item) => (
        <CartCard key={item.id} item={item} actions={actions} />
      ))}
    </ul>
  );
}
