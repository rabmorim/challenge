import { createFileRoute } from '@tanstack/react-router';

import { CheckoutScreen } from '@/features/checkout/components/checkout-screen';
import { validateCheckoutSearch } from '@/features/checkout/lib/checkout-search';

/**
 * Pagamento — rota privada.
 *
 * O guard vem do layout `_private`: o visitante que aciona "Conectar e
 * finalizar" no carrinho cai em `/?auth=entrar&redirect=/pagamento` e volta
 * exatamente aqui depois de entrar, com o carrinho de visitante já mesclado à
 * conta pelo servidor.
 *
 * A etapa do frame de 414 é search param validado (ver `checkout-search.ts`):
 * sobrevive ao refresh e ao histórico, como o resto do estado navegável do app.
 * A rota não desenha faixa nem vão — quem monta o container é a própria tela,
 * porque as duas composições têm larguras diferentes.
 */
function CheckoutRoute() {
  return <CheckoutScreen />;
}

export const Route = createFileRoute('/_private/pagamento')({
  validateSearch: validateCheckoutSearch,
  component: CheckoutRoute,
});
