import { EditionSelector } from '@/features/nft-detail/components/edition-selector';
import { RatingBadge } from '@/features/nft-detail/components/rating-badge';
import { DETAIL_COPY, SUMMARY_TRAITS_COUNT } from '@/features/nft-detail/constants/detail';
import { useEditionOptions } from '@/features/nft-detail/hooks/use-edition-options';
import type { DetailSummaryProps } from '@/features/nft-detail/types/detail-components';

/**
 * Conteúdo da folha de informações do frame de 414.
 *
 * É o resumo da peça — nome, nota, descrição, edição e metadados. O preço não
 * está aqui de propósito: no frame de 414 ele vive na barra fixa, ao lado da
 * quantidade e do botão de compra (ver `BuyBar`).
 *
 * @param props - NFT exibido.
 */
export function DetailSummary({ nft }: DetailSummaryProps) {
  const editions = useEditionOptions(nft);

  return (
    <div className="flex flex-col gap-3 px-6 pt-8 pb-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[20px] leading-4 font-bold">{nft.name}</h1>

        <RatingBadge average={nft.rating.average} count={nft.rating.count} />
      </div>

      <p className="text-tan text-body">{nft.description}</p>

      <EditionSelector
        options={editions.options}
        available={nft.edition.available}
        isPending={editions.isPending}
      />

      {/* 16px entre as linhas de metadado, como no frame de 414. */}
      <dl className="text-icon-muted flex flex-col gap-4 text-[15px] leading-none">
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
    </div>
  );
}
