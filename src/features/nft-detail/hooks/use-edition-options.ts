import { useQuery } from '@tanstack/react-query';

import { nftListQueryOptions } from '@/features/catalog/api/catalog-queries';
import { DEFAULT_SORT, FIRST_PAGE, RELATED_PAGE_SIZE } from '@/features/catalog/constants/catalog';
import { EDITION_CHIPS_LIMIT } from '@/features/nft-detail/constants/detail';
import type { NftDetail, NftSummary } from '@/features/catalog/types/nft';
import type { EditionOptions } from '@/features/nft-detail/types/detail-state';

/**
 * Edições da coleção do NFT exibido.
 *
 * Alimenta os chips `1/n` do detalhe e a seção "Mais desta coleção" com uma
 * consulta só: as duas coisas são a mesma pergunta à API — "o que mais existe
 * nesta coleção?". Os chips ficam em ordem crescente de tiragem (a tiragem
 * menor é a mais rara), e as edições sem unidade aparecem como indisponíveis
 * em vez de sumirem, para que a informação não desapareça da tela.
 *
 * @param nft - NFT exibido.
 * @returns Edições irmãs, itens relacionados e o estado da consulta.
 */
export function useEditionOptions(nft: NftDetail): EditionOptions {
  const { data, isPending } = useQuery(
    nftListQueryOptions({
      collections: [nft.collectionId],
      sort: DEFAULT_SORT,
      page: FIRST_PAGE,
      pageSize: RELATED_PAGE_SIZE,
    }),
  );

  const items = data?.items ?? [];

  // Uma tiragem por chip: a coleção pode ter dois itens de 1/50, e dois chips
  // com o mesmo rótulo não diriam ao usuário o que os separa. O item aberto
  // ganha a vaga da própria tiragem; nas demais, fica o primeiro encontrado.
  const byTotal = new Map<number, NftSummary>();
  for (const item of items) {
    const current = byTotal.get(item.edition.total);
    if (!current || item.id === nft.id) byTotal.set(item.edition.total, item);
  }

  // O frame reserva três chips antes do estado da edição, e a coleção tem mais
  // tiragens que isso. O recorte é o que a linha quer dizer: a edição aberta,
  // sempre, mais as tiragens mais curtas — que são as mais raras, e portanto as
  // que interessam a quem compara. Depois tudo volta à ordem crescente.
  const byRarity = [...byTotal.values()].toSorted((left, right) => {
    if (left.id === nft.id) return -1;
    if (right.id === nft.id) return 1;
    return left.edition.total - right.edition.total;
  });

  return {
    isPending,
    options: byRarity
      .slice(0, EDITION_CHIPS_LIMIT)
      .map((item) => ({
        nftId: item.id,
        slug: item.slug,
        name: item.name,
        total: item.edition.total,
        available: item.edition.available,
        isCurrent: item.id === nft.id,
      }))
      .toSorted((left, right) => left.total - right.total),
    related: items.filter((item) => item.id !== nft.id),
  };
}
