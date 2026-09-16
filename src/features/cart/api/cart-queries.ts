import { queryOptions } from '@tanstack/react-query';

import { fetchCart } from '@/features/cart/api/cart-api';
import { CART_QUERY_SEGMENTS } from '@/features/cart/constants/cart';
import { queryKeys } from '@/lib/query-keys';

/**
 * Query das linhas do carrinho.
 *
 * Vive no ramo privado com o dono na chave (`guest` quando não há sessão),
 * porque o carrinho não é público nem é de ninguém em particular: ele existe
 * para visitante e para conta. A troca de identidade descarta esse ramo
 * inteiro — sem isso, o carrinho do usuário anterior continuaria em cache
 * depois do logout, que é regra eliminatória do desafio.
 *
 * O resumo de valores é outra leitura e mora com a cotação, que é de quem ela
 * pertence: `features/checkout/api/quote-queries.ts`.
 */

/**
 * Query das linhas do carrinho do dono corrente.
 *
 * @param owner - Id do usuário, ou `GUEST_CART_OWNER` para visitante.
 * @returns Opções da query do carrinho.
 */
export function cartQueryOptions(owner: string) {
  return queryOptions({
    queryKey: queryKeys.private(owner, CART_QUERY_SEGMENTS.cart),
    queryFn: ({ signal }) => fetchCart(signal),
  });
}
