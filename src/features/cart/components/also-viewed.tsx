import { CarouselDots } from '@/components/carousel-dots';
import { NftPreviewCard } from '@/components/nft-preview-card';
import { useNftCarousel } from '@/features/catalog/hooks/use-nft-carousel';
import { ALSO_VIEWED_PAGE_SIZE } from '@/features/cart/constants/cart';
import { ALSO_VIEWED_COPY } from '@/features/cart/constants/cart-copy';
import type { AlsoViewedProps } from '@/features/cart/types/cart-components';

/**
 * Seção "Colecionadores também viram", abaixo da tabela.
 *
 * Reaproveita o card e as bolinhas dos carrosséis (os mesmos de "Mais desta
 * coleção", em `src/components`), porque o frame desenha exatamente o mesmo
 * componente nas duas telas. Em larguras estreitas a grade cai para duas
 * colunas em vez de rolar na horizontal — o layout não pode ganhar rolagem
 * lateral.
 *
 * @param props - Itens sugeridos e o estado da consulta.
 */
export function AlsoViewed({ items, isPending }: AlsoViewedProps) {
  const carousel = useNftCarousel(items, ALSO_VIEWED_PAGE_SIZE);

  return (
    <section aria-labelledby="also-viewed-title" className="flex flex-col gap-6">
      <h2
        id="also-viewed-title"
        className="text-link border-divider text-body-lg border-b pb-3 font-bold"
      >
        {ALSO_VIEWED_COPY.title}
      </h2>

      {isPending ? (
        <ul className="grid grid-cols-2 gap-6 lg:grid-cols-5">
          {Array.from({ length: ALSO_VIEWED_PAGE_SIZE }, (_unused, index) => (
            // Placeholders são posicionais: o índice é o único identificador que existe.
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
        <p className="text-tan text-body">{ALSO_VIEWED_COPY.empty}</p>
      ) : (
        <>
          <ul data-testid="also-viewed-grid" className="grid grid-cols-2 gap-6 lg:grid-cols-5">
            {carousel.visible.map((nft) => (
              <li key={nft.id}>
                <NftPreviewCard nft={nft} />
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
