import { Button } from '@/components/ui/button';
import { CART_COPY } from '@/features/cart/constants/cart-copy';
import type { CartErrorProps } from '@/features/cart/types/cart-components';

/**
 * Falha ao carregar o carrinho.
 *
 * Mostra a mensagem do erro já normalizado (o interceptor do Axios entrega um
 * texto pronto para exibição) e uma nova tentativa — falha de rede ou 5xx são
 * recuperáveis, e a tela não pode virar um beco sem saída.
 *
 * @param props - Mensagem da falha e a nova tentativa.
 */
export function CartError({ message, onRetry }: CartErrorProps) {
  return (
    <section
      data-testid="cart-error"
      role="alert"
      className="flex flex-col items-start gap-4 py-16 md:items-center md:text-center"
    >
      <h2 className="text-heading">{CART_COPY.errorTitle}</h2>
      <p className="text-tan text-body max-w-prose">{message}</p>

      <Button onClick={onRetry}>{CART_COPY.errorRetry}</Button>
    </section>
  );
}
