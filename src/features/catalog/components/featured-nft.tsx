import { Link } from '@tanstack/react-router';

import { nftDetailPath } from '@/constants/routes';
import { CATALOG_COPY } from '@/features/catalog/constants/catalog-copy';
import type { FeaturedNftProps } from '@/features/catalog/types/catalog-components';
import { formatEth } from '@/lib/eth';

/**
 * Card "NFT em destaque", logo abaixo da sidebar na Início.
 *
 * O item exibido é o primeiro da aba "Em alta" — vem da mesma API do catálogo,
 * não de uma lista fixa no cliente. O esqueleto ocupa a caixa final para que a
 * coluna não salte quando a arte chega.
 *
 * No `design/Início.png` o cartão mostra só os dois títulos e a arte: nome e
 * preço não aparecem. Eles continuam existindo para quem não vê a imagem — o
 * rótulo acessível do link diz qual NFT é e por quanto está —, mas não são
 * desenhados, senão o cartão passa a repetir o card da grade.
 *
 * @param props - NFT em destaque e o estado de carregamento.
 */
export function FeaturedNft({ nft, isPending }: FeaturedNftProps) {
  return (
    <section
      data-testid="featured-nft"
      aria-label={CATALOG_COPY.featuredTitle}
      className="bg-card rounded-panel flex flex-col gap-2 p-5"
    >
      <h3 className="text-primary text-body-lg font-bold tracking-widest uppercase">
        {CATALOG_COPY.featuredTitle}
      </h3>
      <p className="text-body-lg text-center font-bold tracking-wide uppercase">
        {CATALOG_COPY.featuredSubtitle}
      </p>

      {isPending || !nft ? (
        <div className="skeleton rounded-card mt-2 aspect-square w-full" aria-hidden="true" />
      ) : (
        <Link
          to={nftDetailPath(nft.slug)}
          aria-label={`${nft.name} — ${formatEth(nft.price)}`}
          className="rounded-card mt-2 block"
        >
          <img
            src={nft.imageUrl}
            alt={nft.imageAlt}
            width={270}
            height={270}
            loading="lazy"
            decoding="async"
            className="rounded-card aspect-square w-full object-cover"
          />
        </Link>
      )}
    </section>
  );
}
