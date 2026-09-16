import { useQuery } from '@tanstack/react-query';

import { nftListQueryOptions } from '@/features/catalog/api/catalog-queries';
import { HERO_HIGHLIGHTS_PARAMS } from '@/features/catalog/constants/catalog';
import type { NftSummary } from '@/features/catalog/types/nft';

/**
 * Destaques do herói da Início.
 *
 * São os primeiros itens da aba "Em alta" — mesma API do catálogo, mesma
 * política de cache. Os pontos do carrossel percorrem exatamente esta lista, e
 * o tamanho dela define quantos pontos existem.
 *
 * @returns Destaques e o estado da consulta.
 */
export function useHeroHighlights(): { highlights: NftSummary[]; isPending: boolean } {
  const { data, isPending } = useQuery(nftListQueryOptions(HERO_HIGHLIGHTS_PARAMS));

  return { highlights: data?.items ?? [], isPending };
}
