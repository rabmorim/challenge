import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { nftListQueryOptions } from '@/features/catalog/api/catalog-queries';
import type { CatalogListParams } from '@/features/catalog/types/catalog-search';
import type { NftListState } from '@/features/catalog/types/catalog-state';

/**
 * Listagem do catálogo para os parâmetros correntes da URL.
 *
 * `keepPreviousData` mantém a página anterior visível enquanto a nova carrega:
 * trocar de filtro ou de página não pisca a tela inteira, e o estado de
 * atualização em segundo plano fica explícito (`isRefreshing`) para a interface
 * marcar `aria-busy` e anunciar o que está acontecendo. O esqueleto com shimmer
 * fica reservado ao primeiro carregamento, quando não há nada para preservar.
 *
 * @param params - Parâmetros já traduzidos do estado de URL.
 * @returns Resultado da consulta com os estados que a interface precisa tratar.
 */
export function useNftList(params: CatalogListParams): NftListState {
  const query = useQuery({
    ...nftListQueryOptions(params),
    placeholderData: keepPreviousData,
  });

  const { data, isPending, isError, error, isFetching, isPlaceholderData, refetch } = query;

  return {
    data: data ?? null,
    items: data?.items ?? [],
    isPending,
    isError,
    error,
    // Dados na tela que já não correspondem aos parâmetros pedidos, ou refetch
    // em andamento sobre os mesmos parâmetros.
    isRefreshing: isFetching && !isPending,
    isStale: isPlaceholderData,
    isEmpty: !isPending && !isError && (data?.items.length ?? 0) === 0,
    refetch: () => {
      void refetch();
    },
  };
}
