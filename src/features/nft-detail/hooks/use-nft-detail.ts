import { useQuery } from '@tanstack/react-query';

import { nftDetailQueryOptions } from '@/features/catalog/api/catalog-queries';
import type { NftDetailState } from '@/features/catalog/types/catalog-state';
import { isHttpError } from '@/lib/http';

/**
 * Detalhe de um NFT por id ou slug.
 *
 * Separa "não existe" de "falhou": `NOT_FOUND` é uma resposta definitiva do
 * servidor e leva à tela de recurso inexistente (sem botão de tentar de novo),
 * enquanto falha de rede ou 5xx leva ao estado de erro recuperável. Tratar os
 * dois do mesmo jeito ofereceria uma nova tentativa que nunca daria certo.
 *
 * @param nftId - Identificador vindo da rota.
 * @returns Estado do detalhe, pronto para a tela decidir o que renderizar.
 */
export function useNftDetail(nftId: string): NftDetailState {
  const { data, isPending, isError, error, isFetching, refetch } = useQuery(
    nftDetailQueryOptions(nftId),
  );

  return {
    data: data ?? null,
    isPending,
    isError,
    isNotFound: isError && isHttpError(error) && error.code === 'NOT_FOUND',
    error,
    isRefreshing: isFetching && !isPending,
    refetch: () => {
      void refetch();
    },
  };
}
