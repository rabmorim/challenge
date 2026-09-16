import { useQuery } from '@tanstack/react-query';

import { cartQueryOptions } from '@/features/cart/api/cart-queries';
import { useCartOwner } from '@/features/cart/hooks/use-cart-owner';

/**
 * Contagem de itens do carrinho, para o badge do header.
 *
 * Leitura pura: o total vem do `itemCount` calculado pelo servidor simulado, e
 * não de uma soma no cliente — carrinho e cabeçalho não podem divergir. Funciona
 * para visitante e para usuário autenticado, porque a identidade viaja nos
 * cabeçalhos da requisição.
 *
 * @returns Contagem corrente e o estado da consulta.
 */
export function useCartCount(): { count: number; isPending: boolean } {
  const owner = useCartOwner();
  const { data, isPending } = useQuery(cartQueryOptions(owner));

  return { count: data?.itemCount ?? 0, isPending };
}
