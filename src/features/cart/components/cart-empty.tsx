import { Link } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { CART_COPY, CART_SUMMARY_COPY } from '@/features/cart/constants/cart-copy';

/**
 * Carrinho sem itens.
 *
 * Vazio não é erro: a tela diz o estado e oferece a saída desenhada no frame
 * ("Continuar explorando"), em vez de mostrar uma tabela de cabeçalhos sem
 * linhas ou um resumo zerado que não corresponde a compra nenhuma.
 */
export function CartEmpty() {
  return (
    <section
      data-testid="cart-empty"
      className="flex flex-col items-start gap-4 py-16 md:items-center md:text-center"
    >
      <h2 className="text-heading">{CART_COPY.emptyTitle}</h2>
      <p className="text-tan text-body max-w-prose">{CART_COPY.emptyDescription}</p>

      <Button asChild>
        <Link to={ROUTES.marketplace}>{CART_SUMMARY_COPY.keepExploring}</Link>
      </Button>
    </section>
  );
}
