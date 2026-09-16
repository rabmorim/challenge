import { Link } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';
import { ROUTES, nftDetailPath } from '@/constants/routes';
import { HeroHighlightDots } from '@/features/catalog/components/hero-highlight-dots';
import { HERO_IMAGE_SIZE } from '@/features/catalog/constants/catalog';
import { HOME_COPY } from '@/features/catalog/constants/catalog-copy';
import type { HeroLayoutProps } from '@/features/catalog/types/catalog-components';

/**
 * Herói da Início no frame de 1440.
 *
 * Texto à esquerda em uma coluna de 600px e a arte de 450px à direita, sem
 * superfície atrás — o fundo da página atravessa o bloco inteiro, como no
 * `design/Início.png`.
 *
 * A arte tem dimensões declaradas e é a única com `fetchPriority="high"`: é o
 * maior elemento da primeira dobra, ou seja, o LCP da tela.
 *
 * @param props - Destaques, índice ativo, seletor e estado da consulta.
 */
export function HeroBannerDesktop({
  highlights,
  active,
  activeIndex,
  onSelect,
  isPending,
}: HeroLayoutProps) {
  return (
    <section className="hidden min-h-[450px] grid-cols-[minmax(0,1fr)_450px] items-center gap-8 lg:grid">
      <div className="flex flex-col gap-5 pl-10">
        <p className="text-bright text-body">{HOME_COPY.heroEyebrow}</p>

        <h1 className="text-hero max-w-[520px] uppercase">{HOME_COPY.heroTitle}</h1>

        <p className="text-tan text-body max-w-[600px]">{HOME_COPY.heroDescription}</p>

        <Button asChild className="text-body-lg w-fit px-8 py-3.5">
          <Link to={ROUTES.marketplace}>{HOME_COPY.heroCta}</Link>
        </Button>

        {/* Ponto de 8px e vao de 8px: a faixa inteira fecha os 40x8 do Figma,
            alinhada a direita da mesma caixa de 600px do texto. */}
        <HeroHighlightDots
          highlights={highlights}
          activeIndex={activeIndex}
          onSelect={onSelect}
          className="max-w-[600px] justify-end gap-2 pt-6"
          dotClassName="size-2"
        />
      </div>

      {isPending || !active ? (
        <div className="skeleton rounded-panel size-[450px] shrink-0" aria-hidden="true" />
      ) : (
        <Link to={nftDetailPath(active.slug)} className="rounded-panel block justify-self-end">
          <img
            src={active.imageUrl}
            alt={active.imageAlt}
            width={HERO_IMAGE_SIZE}
            height={HERO_IMAGE_SIZE}
            fetchPriority="high"
            decoding="async"
            className="rounded-panel size-[450px] object-cover"
          />
        </Link>
      )}
    </section>
  );
}
