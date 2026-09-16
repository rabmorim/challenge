import { ADD_TO_CART_COPY } from '@/features/cart/constants/cart-copy';
import { useAddToCart } from '@/features/cart/hooks/use-add-to-cart';
import type { NftDetail } from '@/features/catalog/types/nft';
import type { BuyIntent } from '@/features/nft-detail/types/detail-state';
import type { Quantity } from '@/types/api';

/**
 * Regra por trás dos botões de compra do detalhe.
 *
 * É a mesma decisão nos dois frames (o botão do painel de 1440 e a barra fixa
 * de 414) e nos dois controles da barra — comprar e adicionar ao carrinho —,
 * por isso mora aqui e não em cada JSX:
 *
 * - **edição esgotada** → desabilitado, dizendo o motivo;
 * - **visitante** → abre o painel de autenticação, que é o caminho verdadeiro
 *   do enunciado §3 (o pagamento exige sessão);
 * - **autenticado** → acrescenta a quantidade escolhida ao carrinho, dentro do
 *   que a edição comporta, e o selo do header muda junto.
 *
 * O que não acontece em nenhum caso é aparentar compra: incluir no carrinho
 * **não é** comprar, e uma compra só pode ser confirmada pela resposta da
 * simulação, na etapa do pagamento.
 *
 * @param nft - NFT exibido.
 * @param quantity - Quantidade escolhida no seletor.
 * @returns Estado da edição e o disparo da intenção de compra.
 */
export function useBuyIntent(nft: NftDetail, quantity: Quantity): BuyIntent {
  const { addToCart, isAdding } = useAddToCart({ requireSession: true });
  const isSoldOut = nft.edition.available === 0;

  return {
    isSoldOut,
    isDisabled: isSoldOut || isAdding,
    label: ADD_TO_CART_COPY.buy,
    trigger: () => {
      addToCart(nft.id, quantity);
    },
  };
}
