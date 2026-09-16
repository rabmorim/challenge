import { CarouselDots } from '@/components/carousel-dots';
import { NftPreviewCard } from '@/components/nft-preview-card';
import { RELATED_ITEMS_LIMIT } from '@/features/catalog/constants/catalog';
import { useNftCarousel } from '@/features/catalog/hooks/use-nft-carousel';
import { DETAIL_COPY } from '@/features/nft-detail/constants/detail';
import type { RelatedCollectionProps } from '@/features/nft-detail/types/detail-components';

/**
 * Seção "Mais desta coleção".
 *
 * Lista os demais itens da mesma coleção — vindos da mesma consulta que monta
 * os chips de edição, sem requisição extra — em páginas de
 * `RELATED_ITEMS_LIMIT`, trocadas pelas bolinhas do frame. Em telas estreitas a
 * grade encolhe para duas colunas em vez de rolar na horizontal.
 *
 * @param props - Itens relacionados e o estado da consulta.
 */
export function RelatedCollection({ items, isPending }: RelatedCollectionProps) {
  const carousel = useNftCarousel(items, RELATED_ITEMS_LIMIT);

  return (
    <section aria-labelledby="related-title" className="flex flex-col gap-6">
      <h2
        className="text-primary text-body-lg border-input/60 border-b pb-2 font-bold"
        id="related-title"
      >
        {DETAIL_COPY.relatedTitle}
      </h2>

      {isPending ? (
        <ul className="grid grid-cols-2 gap-6 lg:grid-cols-5">
          {Array.from({ length: RELATED_ITEMS_LIMIT }, (_unused, index) => (
            <li key={index} className="flex flex-col gap-3">
              <div className="bg-card rounded-card p-2">
                <div className="skeleton rounded-card aspect-square w-full" />
              </div>
              <div className="skeleton h-4 w-3/4 rounded-sm" />
              <div className="skeleton h-4 w-1/3 rounded-sm" />
            </li>
          ))}
        </ul>
      ) : items.length === 0 ? (
        <p className="text-tan text-body">{DETAIL_COPY.relatedEmpty}</p>
      ) : (
        <>
          <ul data-testid="related-grid" className="grid grid-cols-2 gap-6 lg:grid-cols-5">
            {carousel.visible.map((item) => (
              <li key={item.id}>
                <NftPreviewCard nft={item} />
              </li>
            ))}
          </ul>

          <CarouselDots
            page={carousel.page}
            pageCount={carousel.pageCount}
            onSelect={carousel.goToPage}
          />
        </>
      )}
    </section>
  );
}
