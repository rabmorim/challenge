import { useQuery } from '@tanstack/react-query';

import { cartQueryOptions } from '@/features/cart/api/cart-queries';
import { useCartOwner } from '@/features/cart/hooks/use-cart-owner';
import type { CartState } from '@/features/cart/types/cart-state';
import { isHttpError } from '@/lib/http';

/**
 * Leitura do carrinho do dono corrente.
 *
 * Nomeia os estados que a tela precisa tratar em vez de deixar cada componente
 * combinar flags na mão — o mesmo desenho de `useNftList`, pelo mesmo motivo:
 * "vazio" e "carregando" não são a mesma coisa, e "revalidando com dados na
 * tela" não pode virar esqueleto.
 *
 * @returns Linhas, contagem e os cinco estados da consulta.
 */
export function useCart(): CartState {
  const owner = useCartOwner();
  const query = useQuery(cartQueryOptions(owner));

  const items = query.data?.items ?? [];

  return {
    owner,
    items,
    itemCount: query.data?.itemCount ?? 0,
    isPending: query.isPending,
    isEmpty: !query.isPending && !query.isError && items.length === 0,
    isError: query.isError,
    error: isHttpError(query.error) ? query.error : null,
    isRefreshing: query.isFetching && !query.isPending,
    refetch: () => {
      void query.refetch();
    },
  };
}
