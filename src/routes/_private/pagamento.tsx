import { createFileRoute } from '@tanstack/react-router';

import { ROUTE_SEO } from '@/constants/seo';
import { routeHead } from '@/lib/route-head';

import { CheckoutScreen } from '@/features/checkout/components/checkout-screen';

/**
 * Pagamento — rota privada.
 *
 * O guard vem do layout `_private`: o visitante que aciona "Conectar e
 * finalizar" no carrinho cai em `/?auth=entrar&redirect=/pagamento` e volta
 * exatamente aqui depois de entrar, com o carrinho de visitante já mesclado à
 * conta pelo servidor.
 *
 * A rota não desenha faixa nem vão — quem monta o container é a própria tela,
 * porque as duas composições têm larguras diferentes.
 */
function CheckoutRoute() {
  return <CheckoutScreen />;
}

export const Route = createFileRoute('/_private/pagamento')({
  head: () => routeHead(ROUTE_SEO.checkout),
  component: CheckoutRoute,
});
