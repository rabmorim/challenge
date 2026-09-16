import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { nftListQueryOptions } from '@/features/catalog/api/catalog-queries';
import { ALSO_VIEWED_PARAMS } from '@/features/cart/constants/cart';
import type { CartItem } from '@/features/cart/types/cart';
import type { AlsoViewedProps } from '@/features/cart/types/cart-components';

/**
 * Itens da seção "Colecionadores também viram".
 *
 * São os mais favoritados do catálogo, **menos** o que já está no carrinho:
 * sugerir de novo o que a pessoa acabou de escolher não ajuda ninguém, e o
 * frame mostra cinco peças diferentes das da tabela.
 *
 * A consulta é a mesma do catálogo (`nftListQueryOptions`), com parâmetros
 * constantes — então ela compartilha cache com qualquer outra tela que peça a
 * mesma página, e `nft.updated` mantém preço e disponibilidade em dia sem
 * trabalho extra aqui.
 *
 * @param items - Linhas do carrinho, que saem da lista.
 * @returns Itens sugeridos e o estado da consulta.
 */
export function useAlsoViewed(items: readonly CartItem[]): AlsoViewedProps {
  const { data, isPending } = useQuery(nftListQueryOptions(ALSO_VIEWED_PARAMS));

  const inCart = useMemo(() => new Set(items.map((item) => item.nftId)), [items]);

  return {
    items: (data?.items ?? []).filter((nft) => !inCart.has(nft.id)),
    isPending,
  };
}
