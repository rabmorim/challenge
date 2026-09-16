import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NETWORKS } from '@/constants/network';
import { DETAIL_COPY } from '@/features/nft-detail/constants/detail';
import { ReviewList } from '@/features/nft-detail/components/review-list';
import type { NftInfoPanelProps } from '@/features/nft-detail/types/detail-components';
import { cn } from '@/lib/utils';

/**
 * Abas "Detalhes do NFT" e "Avaliações de colecionadores".
 *
 * O Radix dá a semântica de `tablist` que o desenho não tem: setas do teclado,
 * painel associado ao gatilho e estado anunciado. Os dois painéis mostram dado
 * real — descrição, rede, contrato e direitos do próprio recurso, e as
 * avaliações que a API entrega junto do detalhe.
 *
 * @param props - NFT exibido.
 */
export function DetailTabs({ nft }: NftInfoPanelProps) {
  const triggerClassName = cn(
    'text-body-lg rounded-none border-b-2 border-b-transparent pb-2',
    'data-[state=active]:border-b-primary data-[state=active]:text-primary',
    'data-[state=inactive]:text-foreground',
  );

  return (
    <Tabs defaultValue="details" className="gap-6">
      <TabsList
        aria-label={DETAIL_COPY.tabsLabel}
        className="border-input/60 flex flex-wrap gap-6 border-b"
      >
        <TabsTrigger value="details" className={triggerClassName}>
          {DETAIL_COPY.tabDetails}
        </TabsTrigger>
        <TabsTrigger value="reviews" className={triggerClassName}>
          {DETAIL_COPY.tabReviews(nft.rating.count)}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="flex flex-col gap-6">
        {nft.story.split('\n\n').map((paragraph) => (
          <p key={paragraph} className="text-tan text-body max-w-[1200px]">
            {paragraph}
          </p>
        ))}

        <dl className="flex flex-col gap-4">
          <div>
            <dt className="text-body-lg font-bold">{DETAIL_COPY.networkTitle}</dt>
            <dd className="text-tan text-body">
              {DETAIL_COPY.networkDescription(NETWORKS[nft.network].label)}
            </dd>
          </div>

          <div>
            <dt className="text-body-lg font-bold">{DETAIL_COPY.royaltiesTitle}</dt>
            <dd className="text-tan text-body">{DETAIL_COPY.royaltiesDescription}</dd>
          </div>

          <div>
            <dt className="text-body-lg font-bold">{DETAIL_COPY.contractTitle}</dt>
            <dd className="text-tan text-body">
              {DETAIL_COPY.contractDescription(nft.contractAddress)}
            </dd>
          </div>
        </dl>
      </TabsContent>

      <TabsContent value="reviews">
        <ReviewList reviews={nft.reviews} rating={nft.rating} />
      </TabsContent>
    </Tabs>
  );
}
