import { Link } from '@tanstack/react-router';
import { ArrowRightIcon } from 'lucide-react';

import { ROUTES, nftDetailPath } from '@/constants/routes';
import { HeroHighlightDots } from '@/features/catalog/components/hero-highlight-dots';
import { HERO_MOBILE_IMAGE_SIZE } from '@/features/catalog/constants/catalog';
import { HOME_COPY } from '@/features/catalog/constants/catalog-copy';
import type { HeroLayoutProps } from '@/features/catalog/types/catalog-components';

/**
 * Herói da Início no frame de 414.
 *
 * Cartão de 190px de altura e raio 12, com o degrade das superfícies do celular
 * e dois círculos de 248px sangrando pelas bordas — a composição do frame. Os
 * círculos são decorativos (`aria-hidden`) e ficam atrás do texto; o recorte
 * fica por conta do `overflow-hidden` do cartão.
 *
 * A altura é **mínima**, e não fixa: abaixo de 360px o texto não cabe nos 190px
 * do frame, então a arte encolhe e o cartão cresce em vez de cortar conteúdo.
 *
 * A arte tem dimensões declaradas e é a única com `fetchPriority="high"`: é o
 * maior elemento da primeira dobra, ou seja, o LCP da tela.
 *
 * @param props - Destaques, índice ativo, seletor e estado da consulta.
 */
export function HeroBannerMobile({
  highlights,
  active,
  activeIndex,
  onSelect,
  isPending,
}: HeroLayoutProps) {
  return (
    <section className="surface-gradient-lifted rounded-hero relative min-h-[190px] overflow-hidden px-4 pt-[5px] pb-6 lg:hidden">
      <span
        aria-hidden="true"
        className="hero-ellipse absolute -top-[31px] -left-20 size-[248px] rounded-full"
      />
      <span
        aria-hidden="true"
        className="hero-ellipse absolute -top-[10px] left-[73px] size-[248px] rounded-full"
      />

      <div className="relative flex flex-col gap-1.5 pr-[144px] max-[359px]:pr-[102px]">
        <p className="text-bright text-eyebrow">{HOME_COPY.heroEyebrow}</p>

        <h1 className="text-hero-mobile uppercase">{HOME_COPY.heroTitleMobile}</h1>

        <p className="text-tan text-hero-body">{HOME_COPY.heroDescriptionMobile}</p>

        <Link
          to={ROUTES.marketplace}
          className="rounded-control text-link text-cta -mt-1 flex w-fit items-center gap-2"
        >
          {HOME_COPY.heroCta}
          <ArrowRightIcon className="size-3.5" aria-hidden="true" />
        </Link>
      </div>

      {isPending || !active ? (
        <div
          className="skeleton rounded-media absolute top-[10px] right-4 size-[138px] max-[359px]:size-24"
          aria-hidden="true"
        />
      ) : (
        <Link
          to={nftDetailPath(active.slug)}
          className="rounded-media absolute top-[10px] right-4 block"
        >
          <img
            src={active.imageUrl}
            alt={active.imageAlt}
            width={HERO_MOBILE_IMAGE_SIZE}
            height={HERO_MOBILE_IMAGE_SIZE}
            fetchPriority="high"
            decoding="async"
            className="rounded-media size-[138px] object-cover max-[359px]:size-24"
          />
        </Link>
      )}

      <HeroHighlightDots
        highlights={highlights}
        activeIndex={activeIndex}
        onSelect={onSelect}
        className="absolute bottom-1.5 left-1/2 -translate-x-1/2 gap-1.5"
        dotClassName="size-[7px]"
      />
    </section>
  );
}
