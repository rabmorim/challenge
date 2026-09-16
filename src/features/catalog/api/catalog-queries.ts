import { queryOptions } from '@tanstack/react-query';

import { fetchNft, listNfts } from '@/features/catalog/api/nfts-api';
import { CATALOG_QUERY_SEGMENTS } from '@/features/catalog/constants/catalog';
import type { CatalogListParams } from '@/features/catalog/types/catalog-search';
import { queryKeys } from '@/lib/query-keys';

/**
 * Opções de query do catálogo.
 *
 * Os parâmetros entram **inteiros** na query key: parâmetros diferentes são
 * entradas de cache diferentes, então uma resposta atrasada só tem onde
 * aterrissar na chave que a pediu — ela nunca sobrescreve o resultado de outro
 * filtro. É o que resolve "respostas fora de ordem" por construção, sem
 * comparar carimbos de tempo na interface.
 *
 * O `signal` do TanStack Query é repassado ao Axios, então a troca de filtro
 * também **aborta** a requisição anterior em vez de apenas ignorá-la.
 */

/**
 * Listagem do catálogo para um conjunto de parâmetros.
 *
 * @param params - Parâmetros já traduzidos do estado de URL (`toListParams`).
 * @returns Opções da query, prontas para `useQuery` ou `ensureQueryData`.
 */
export function nftListQueryOptions(params: CatalogListParams) {
  return queryOptions({
    queryKey: queryKeys.public(CATALOG_QUERY_SEGMENTS.nfts, CATALOG_QUERY_SEGMENTS.list, params),
    queryFn: ({ signal }) => listNfts(params, signal),
  });
}

/**
 * Detalhe de um NFT por id ou slug.
 *
 * @param nftId - Identificador aceito pela rota de detalhe.
 * @returns Opções da query do detalhe.
 */
export function nftDetailQueryOptions(nftId: string) {
  return queryOptions({
    queryKey: queryKeys.public(CATALOG_QUERY_SEGMENTS.nfts, CATALOG_QUERY_SEGMENTS.detail, nftId),
    queryFn: ({ signal }) => fetchNft(nftId, signal),
  });
}
