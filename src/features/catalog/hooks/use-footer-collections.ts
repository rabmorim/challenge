import { useQuery } from '@tanstack/react-query';

import { FOOTER_COLLECTION_IDS } from '@/constants/footer';
import { nftListQueryOptions } from '@/features/catalog/api/catalog-queries';
import { FOOTER_COLLECTIONS_PARAMS } from '@/features/catalog/constants/catalog';
import type { NftFacetOption } from '@/features/catalog/types/catalog-query';

/**
 * Coleções listadas no rodapé.
 *
 * Reusa as facetas da listagem — é a mesma verdade que a sidebar usa, e o
 * pedido é de uma página só (`pageSize: 1`), porque o rodapé precisa dos nomes,
 * não dos itens. Em telas de catálogo a resposta costuma já estar em cache;
 * nas demais é uma requisição pequena.
 *
 * Quais coleções entram está em `FOOTER_COLLECTION_IDS`: o frame lista cinco
 * das nove, e não as cinco primeiras. Uma coleção que a API deixe de publicar
 * simplesmente some da coluna, em vez de virar um link morto.
 *
 * @returns Coleções exibidas, na ordem do frame.
 */
export function useFooterCollections(): NftFacetOption[] {
  const { data } = useQuery(nftListQueryOptions(FOOTER_COLLECTIONS_PARAMS));
  const facets = data?.facets.collections;
  if (!facets) return [];

  return FOOTER_COLLECTION_IDS.flatMap(
    (id) => facets.find((collection) => collection.id === id) ?? [],
  );
}
