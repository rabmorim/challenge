import { Link } from '@tanstack/react-router';

import { PREVIEW_CARD_IMAGE_SIZE } from '@/constants/carousel';
import { nftDetailPath } from '@/constants/routes';
import type { NftPreviewCardProps } from '@/types/components';
import { formatEth } from '@/lib/eth';

/**
 * Card compacto de NFT usado nos carrosséis.
 *
 * Segue o desenho do card da Início: a superfície `#241612` envolve **só** a
 * arte, e nome e preço ficam abaixo dela, sobre o fundo da página. A moldura
 * tem proporção fixa e a arte tem dimensões declaradas, então trocar de página
 * do carrossel não desloca a seção.
 *
 * Vive fora das features porque o mesmo card aparece em "Mais desta coleção"
 * (detalhe) e em "Colecionadores também viram" (carrinho).
 *
 * @param props - NFT resumido a exibir.
 */
export function NftPreviewCard({ nft }: NftPreviewCardProps) {
  return (
    <article data-testid="nft-preview-card" data-slug={nft.slug} className="flex flex-col">
      <div className="bg-card rounded-card p-2">
        <Link
          to={nftDetailPath(nft.slug)}
          tabIndex={-1}
          aria-hidden="true"
          className="rounded-card block"
        >
          <img
            src={nft.imageUrl}
            alt=""
            width={PREVIEW_CARD_IMAGE_SIZE}
            height={PREVIEW_CARD_IMAGE_SIZE}
            loading="lazy"
            decoding="async"
            className="rounded-card aspect-square w-full object-cover"
          />
        </Link>
      </div>

      <div className="flex flex-col gap-1 pt-3">
        <h3 className="text-body">
          {/* A arte ao lado leva ao mesmo destino, então só este link entra na
              ordem de tabulação — evita parar duas vezes no mesmo item. */}
          <Link to={nftDetailPath(nft.slug)} className="rounded-control">
            {nft.name}
          </Link>
        </h3>

        <p className="text-primary text-body font-bold">{formatEth(nft.price)}</p>
      </div>
    </article>
  );
}
