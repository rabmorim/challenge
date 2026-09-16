import { createFileRoute } from '@tanstack/react-router';

import { ROUTE_SEO } from '@/constants/seo';
import { routeHead } from '@/lib/route-head';

import { CartScreen } from '@/features/cart/components/cart-screen';

/**
 * Carrinho de NFTs.
 *
 * A rota não desenha faixa nem vão: o frame de 414 sangra na largura da tela
 * (o painel do resumo encosta no rodapé) e quem monta o container do frame de
 * 1440 é a própria tela.
 *
 * Não há guard aqui de propósito — o carrinho existe para visitante e para
 * conta, e é o guard do `/pagamento` que faz o gate de sessão do "Conectar e
 * finalizar".
 */
function CartRoute() {
  return <CartScreen />;
}

export const Route = createFileRoute('/carrinho')({
  head: () => routeHead(ROUTE_SEO.cart),
  component: CartRoute,
});
