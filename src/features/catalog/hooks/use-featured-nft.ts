import { useQuery } from '@tanstack/react-query';

import { nftListQueryOptions } from '@/features/catalog/api/catalog-queries';
import { FEATURED_NFT_PARAMS } from '@/features/catalog/constants/catalog';
import type { NftSummary } from '@/features/catalog/types/nft';

/**
 * NFT do card "em destaque" da sidebar.
 *
 * Sai da aba "Em alta", buscado com os mesmos parâmetros que qualquer outra
 * consulta do catálogo — o destaque não é uma lista fixa no cliente, é um
 * recorte da API. Chave própria, então mudar filtros na grade não troca o
 * destaque nem invalida o cache dele.
 *
 * @returns NFT em destaque (ou `null`) e o estado da consulta.
 */
export function useFeaturedNft(): { nft: NftSummary | null; isPending: boolean } {
  const { data, isPending } = useQuery(nftListQueryOptions(FEATURED_NFT_PARAMS));
  const items = data?.items ?? [];

  // O card diz "OFERTA LIMITADA": o destaque é o primeiro item em alta que está
  // de fato em promoção (tem preço anterior). Sem nenhum em promoção, cai no
  // primeiro da lista, em vez de esconder a seção.
  const discounted = items.find((item) => item.previousPrice !== null);

  return { nft: discounted ?? items[0] ?? null, isPending };
}
