import { useState } from 'react';

import type { NftSummary } from '@/features/catalog/types/nft';
import type { NftCarousel } from '@/features/catalog/types/catalog-state';

/**
 * Paginação dos carrosséis de NFT ("Mais desta coleção", "Colecionadores
 * também viram").
 *
 * As bolinhas do frame trocam os itens de verdade: cada uma é uma fatia da
 * lista que a API devolveu, e o total sai do tamanho dessa lista — não é um
 * número desenhado. Com itens de menos para uma segunda fatia, sobra uma
 * página só e a fila de bolinhas não aparece.
 *
 * A página corrente é reposicionada quando a lista encolhe (um `nft.updated`
 * pode tirar um item da coleção, um item pode sair do carrinho), para que o
 * carrossel não fique parado numa página que deixou de existir.
 *
 * @param items - Itens do carrossel, na ordem que a API devolveu.
 * @param pageSize - Cards visíveis por página, conforme o frame da seção.
 * @returns Itens visíveis, página corrente, total de páginas e o seletor.
 */
export function useNftCarousel(items: NftSummary[], pageSize: number): NftCarousel {
  const [page, setPage] = useState(0);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const start = current * pageSize;

  return {
    visible: items.slice(start, start + pageSize),
    page: current,
    pageCount,
    goToPage: setPage,
  };
}
