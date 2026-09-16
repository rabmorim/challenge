import { BuyBar } from '@/features/nft-detail/components/buy-bar';
import { DetailArt } from '@/features/nft-detail/components/detail-art';
import { DetailSummary } from '@/features/nft-detail/components/detail-summary';
import { DetailTabs } from '@/features/nft-detail/components/detail-tabs';
import { DetailTopBar } from '@/features/nft-detail/components/detail-top-bar';
import { RelatedCollection } from '@/features/nft-detail/components/related-collection';
import { useEditionOptions } from '@/features/nft-detail/hooks/use-edition-options';
import type { NftDetailMobileProps } from '@/features/nft-detail/types/detail-components';

/**
 * Detalhe do NFT no frame de 414.
 *
 * A composição é outra, e não a de 1440 encolhida: a arte sangra na largura da
 * tela sobre o degradê das superfícies, a folha de informações sobe por cima da
 * borda de baixo da obra (é isso que dá o recorte de 31px do frame) e a barra
 * de compra fica presa ao rodapé.
 *
 * Abaixo do resumo continuam as abas e "Mais desta coleção" — o frame mostra só
 * a primeira dobra, e cortá-las tiraria do celular a ficha técnica, as
 * avaliações e o resto da coleção. Elas seguem dentro da mesma folha, para o
 * fundo não se partir no meio da rolagem.
 *
 * @param props - NFT carregado.
 */
export function NftDetailMobile({ nft }: NftDetailMobileProps) {
  const editions = useEditionOptions(nft);

  return (
    <div data-testid="nft-detail-mobile">
      <section className="surface-gradient px-7 pt-[27px]">
        <DetailTopBar nft={nft} />

        <div className="mt-1">
          <DetailArt images={nft.gallery} alt={nft.imageAlt} name={nft.name} />
        </div>
      </section>

      <div className="bg-surface relative -mt-[30px] rounded-t-[31px]">
        <DetailSummary nft={nft} />

        <div className="flex flex-col gap-12 px-6 pb-10">
          <DetailTabs nft={nft} />

          <RelatedCollection items={editions.related} isPending={editions.isPending} />
        </div>
      </div>

      <BuyBar nft={nft} />
    </div>
  );
}
