import { Link } from '@tanstack/react-router';

import { FavoriteButton } from '@/features/catalog/components/favorite-button';
import { NftCardActions } from '@/features/catalog/components/nft-card-actions';
import { CARD_IMAGE_SIZE } from '@/features/catalog/constants/catalog';
import type { NftCardProps } from '@/features/catalog/types/catalog-components';
import { nftDetailPath } from '@/constants/routes';
import { formatEth } from '@/lib/eth';
import { cn } from '@/lib/utils';

/**
 * Card do catálogo.
 *
 * A superfície envolve **só a arte**; nome e preço ficam abaixo dela, sobre o
 * fundo da página, nos dois frames. As medidas mudam com a largura: no frame de
 * 1440 é `#241612` chapado, raio 15, com 24px acima da arte e 4px nas laterais;
 * no de 414 é o degrade `#241612 → #2F1D15`, raio 20, com 12px acima e 20px
 * abaixo — a caixa de 175x200 do frame.
 *
 * O frame não desenha selo de raridade em card nenhum, então o card também não
 * tem: a raridade continua sendo filtro e atributo do detalhe. O preço anterior
 * aparece só quando o dado existe.
 *
 * A arte não é adiada (`loading` padrão): as nove posições da grade reutilizam
 * quatro arquivos, então adiá-las não economiza requisição e ainda deixa o card
 * vazio em captura de página inteira. As dimensões são declaradas e a moldura
 * tem proporção fixa, então a chegada da arte não empurra o conteúdo (sem CLS).
 *
 * @param props - NFT a exibir e estado de favorito.
 */
export function NftCard({ nft, isFavorite, isFavoritePending, onToggleFavorite }: NftCardProps) {
  const hasDiscount = nft.previousPrice !== null;
  const isSoldOut = nft.edition.available === 0;

  return (
    <article data-testid="nft-card" data-slug={nft.slug} className="group flex flex-col">
      <div
        className={cn(
          'surface-gradient rounded-card-mobile relative px-1 pt-3 pb-5',
          'lg:bg-card lg:rounded-card lg:bg-none lg:pt-6 lg:pb-6',
          'border-t-2 border-t-transparent transition-colors',
          'lg:group-hover:border-t-primary lg:group-focus-within:border-t-primary',
        )}
      >
        <div className="relative mx-auto w-fit">
          <Link
            to={nftDetailPath(nft.slug)}
            className="rounded-media lg:rounded-card block focus-visible:outline-offset-4"
          >
            <img
              src={nft.imageUrl}
              alt={nft.imageAlt}
              width={CARD_IMAGE_SIZE}
              height={CARD_IMAGE_SIZE}
              decoding="async"
              className="rounded-media lg:rounded-card aspect-square w-full max-w-[250px] object-cover"
            />
          </Link>

          <NftCardActions nft={nft}>
            <FavoriteButton
              nftId={nft.id}
              nftName={nft.name}
              isFavorite={isFavorite}
              isPending={isFavoritePending}
              onToggle={onToggleFavorite}
              variant="overlay"
            />
          </NftCardActions>
        </div>
      </div>

      <div className="flex flex-col px-2 pt-2.5 lg:gap-2.5 lg:px-1 lg:pt-4">
        <h3 className="text-card-mobile lg:text-body-lg">
          <Link to={nftDetailPath(nft.slug)} className="rounded-control">
            {nft.name}
          </Link>
        </h3>

        <p className="flex items-baseline gap-2">
          <span
            data-testid="nft-price"
            className="text-primary text-card-mobile lg:text-body-lg font-bold"
          >
            {formatEth(nft.price)}
          </span>
          {/* O frame põe o preço antigo apenas ao lado, sem risco: quem usa
              leitor de tela recebe o papel dele pelo rótulo escondido. */}
          {hasDiscount && (
            <span className="text-tan text-card-mobile lg:text-body-lg">
              <span className="sr-only">Preço anterior: </span>
              {formatEth(nft.previousPrice ?? '0')}
            </span>
          )}
        </p>

        {isSoldOut && <p className="text-tan text-card-mobile lg:text-body">Edição esgotada</p>}
      </div>
    </article>
  );
}
