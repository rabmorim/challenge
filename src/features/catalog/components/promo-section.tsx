import { Link } from '@tanstack/react-router';
import { ArrowRightIcon } from 'lucide-react';
import { useId } from 'react';

import { HOME_COPY } from '@/features/catalog/constants/catalog-copy';
import { PROMO_CARDS } from '@/features/catalog/constants/home-content';
import { useHeroHighlights } from '@/features/catalog/hooks/use-hero-highlights';

/**
 * Os dois cartões de promoção abaixo do catálogo na Início.
 *
 * Cada CTA leva ao Mercado já com um recorte real aplicado à URL (edições
 * lendárias, catálogo completo ordenado por novidade) — é navegação de verdade,
 * com o mesmo estado de busca que a sidebar produz.
 *
 * A arte vem dos destaques da própria API, para não fixar imagem de um item que
 * pode nem estar mais no catálogo. Qual destaque cada cartão usa está no
 * `artworkIndex` da constante — o frame não repete a ordem da lista.
 *
 * Medidas do Figma: dois cartões de 586×250 com raio 8 dentro dos 1200 da
 * página, o que deixa 28px de vão entre eles. A altura é fixa porque a arte
 * sangra na metade esquerda — sem ela o cartão cresceria com o texto.
 */
export function PromoSection() {
  const headingId = useId();
  const { highlights } = useHeroHighlights();

  return (
    <section aria-labelledby={headingId} className="grid gap-7 md:grid-cols-2">
      <h2 className="sr-only" id={headingId}>
        {HOME_COPY.promosTitle}
      </h2>

      {PROMO_CARDS.map((promo) => {
        const artwork = highlights[promo.artworkIndex] ?? highlights[0] ?? null;

        return (
          <article
            key={promo.title}
            className="bg-card rounded-panel grid items-stretch overflow-hidden sm:h-[250px] sm:grid-cols-2"
          >
            {artwork ? (
              <img
                src={artwork.imageUrl}
                alt=""
                width={287}
                height={250}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="skeleton h-[250px]" aria-hidden="true" />
            )}

            <div className="flex flex-col items-end justify-center gap-3 p-5 text-right">
              <h3 className="text-body-lg font-bold">{promo.title}</h3>
              <p className="text-tan text-body">{promo.description}</p>
              <Link
                to={promo.to}
                search={promo.search}
                className="bg-primary text-primary-foreground rounded-control text-body inline-flex items-center gap-2 px-4 py-2.5 font-bold"
              >
                {promo.cta}
                <ArrowRightIcon className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </article>
        );
      })}
    </section>
  );
}
