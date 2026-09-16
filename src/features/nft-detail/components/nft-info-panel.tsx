import { FavoriteButton } from '@/features/catalog/components/favorite-button';
import { useFavorites } from '@/features/catalog/hooks/use-favorites';
import { BuyActions } from '@/features/nft-detail/components/buy-actions';
import { EditionSelector } from '@/features/nft-detail/components/edition-selector';
import { QuantityStepper } from '@/features/nft-detail/components/quantity-stepper';
import { ShareLinks } from '@/features/nft-detail/components/share-links';
import { StarRating } from '@/features/nft-detail/components/star-rating';
import { DETAIL_COPY, SUMMARY_TRAITS_COUNT } from '@/features/nft-detail/constants/detail';
import { useEditionOptions } from '@/features/nft-detail/hooks/use-edition-options';
import { useQuantitySelection } from '@/features/nft-detail/hooks/use-quantity-selection';
import type { NftInfoPanelProps } from '@/features/nft-detail/types/detail-components';
import { formatEth } from '@/lib/eth';

/**
 * Coluna de informações do detalhe: nome, preço, nota, edição, quantidade,
 * compra e metadados.
 *
 * O preço e a disponibilidade vêm do recurso, que o `nft.updated` mantém
 * atualizado enquanto a tela está aberta — o teto do seletor de quantidade
 * acompanha sozinho, porque é derivado deles.
 *
 * @param props - NFT exibido.
 */
export function NftInfoPanel({ nft }: NftInfoPanelProps) {
  const favorites = useFavorites();
  const editions = useEditionOptions(nft);
  const { quantity, max, setQuantity } = useQuantitySelection(nft);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-heading">{nft.name}</h1>

      <div className="border-input/60 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <p className="flex items-baseline gap-3">
          <span className="text-primary text-heading" data-testid="detail-price">
            {formatEth(nft.price)}
          </span>
          {nft.previousPrice !== null && (
            <span className="text-tan text-body-lg line-through">
              <span className="sr-only">Preço anterior: </span>
              {formatEth(nft.previousPrice)}
            </span>
          )}
        </p>

        <StarRating average={nft.rating.average} count={nft.rating.count} />
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-body-lg font-bold">{DETAIL_COPY.aboutTitle}</h2>
        <p className="text-tan text-body max-w-prose">{nft.description}</p>
      </section>

      <EditionSelector
        options={editions.options}
        available={nft.edition.available}
        isPending={editions.isPending}
      />

      {/* No frame o seletor fica à esquerda e o par de botões encostado à
          direita, na mesma linha. */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <QuantityStepper value={quantity} max={max} onChange={setQuantity} />

        <div className="flex flex-wrap items-center gap-3">
          <BuyActions nft={nft} quantity={quantity} />

          <FavoriteButton
            nftId={nft.id}
            nftName={nft.name}
            isFavorite={favorites.favoriteIds.has(nft.id)}
            isPending={favorites.pendingNftId === nft.id}
            onToggle={favorites.toggleFavorite}
            variant="outline"
          />
        </div>
      </div>

      {/* Região viva: a alternância de favorito precisa ser percebida por quem
          não vê o coração mudar de estado. */}
      <output className="sr-only" aria-live="polite">
        {favorites.announcement}
      </output>

      {/* 12px entre as linhas de metadado, como no frame. */}
      <dl className="text-tan text-body-lg flex flex-col gap-3">
        <div className="flex gap-2">
          <dt>{DETAIL_COPY.tokenId}</dt>
          <dd>#{nft.tokenId}</dd>
        </div>
        <div className="flex gap-2">
          <dt>{DETAIL_COPY.collection}</dt>
          <dd>{nft.collectionName}</dd>
        </div>
        <div className="flex gap-2">
          <dt>{DETAIL_COPY.traits}</dt>
          <dd>
            {nft.traits
              .slice(0, SUMMARY_TRAITS_COUNT)
              .map((trait) => trait.value)
              .join(', ')}
          </dd>
        </div>
      </dl>

      <ShareLinks name={nft.name} />
    </div>
  );
}
