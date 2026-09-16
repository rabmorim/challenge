import { useCallback } from 'react';
import { toast } from 'sonner';

import { AUTH_TABS } from '@/features/auth/constants/auth';
import { useAuthPanel } from '@/features/auth/hooks/use-auth-panel';
import { useSession } from '@/features/auth/hooks/use-session';
import { ADD_TO_CART_COPY } from '@/features/cart/constants/cart-copy';
import { useCartMutations } from '@/features/cart/hooks/use-cart-mutations';
import type { AddToCartApi, AddToCartOptions } from '@/features/cart/types/cart-state';
import type { Quantity } from '@/types/api';

/**
 * Ação de "adicionar ao carrinho", com ou sem gate de sessão.
 *
 * O gate é um parâmetro, e não uma regra fixa, porque os dois botões do design
 * não pedem a mesma coisa:
 *
 * - **"COMPRAR NFT" (detalhe)** é intenção de compra e leva ao pagamento, que
 *   exige sessão. Deslogado, ele abre o painel de autenticação em vez de
 *   fingir — o caminho verdadeiro do enunciado §3.
 * - **ícone de carrinho (card do catálogo)** é só adicionar, e o carrinho
 *   aceita visitante por contrato: é para isso que existe o `x-guest-id`, e é o
 *   que torna verificável o requisito de **preservar os itens do visitante ao
 *   autenticar** (README §3). Sem um caminho de inclusão anônimo, o carrinho de
 *   visitante nunca teria itens e a fusão no login não existiria na prática.
 *
 * A disponibilidade e o limite por pedido continuam sendo do servidor: aqui o
 * botão só não oferece o que já se sabe recusado (edição esgotada), e a resposta
 * de conflito vira mensagem quando a corrida acontece mesmo assim.
 *
 * @param options - `requireSession` liga o gate de autenticação.
 * @returns Ação de incluir e o estado da inclusão em voo.
 */
export function useAddToCart({ requireSession = false }: AddToCartOptions = {}): AddToCartApi {
  const { isAuthenticated } = useSession();
  const authPanel = useAuthPanel();
  const { addItem, isAdding } = useCartMutations();

  const addToCart = useCallback(
    (nftId: string, quantity: Quantity) => {
      if (requireSession && !isAuthenticated) {
        toast.info(ADD_TO_CART_COPY.requiresSession);
        authPanel.open(AUTH_TABS.signIn);
        return;
      }

      addItem(nftId, quantity);
    },
    [addItem, authPanel, isAuthenticated, requireSession],
  );

  return { addToCart, isAdding };
}
