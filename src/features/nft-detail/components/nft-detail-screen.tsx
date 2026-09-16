import { Link } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { MARKETPLACE_COPY } from '@/features/catalog/constants/catalog-copy';
import { useNftRealtime } from '@/features/catalog/hooks/use-nft-realtime';
import { DetailTabs } from '@/features/nft-detail/components/detail-tabs';
import { NftDetailMobile } from '@/features/nft-detail/components/nft-detail-mobile';
import { NftDetailMobileSkeleton } from '@/features/nft-detail/components/nft-detail-mobile-skeleton';
import { NftDetailSkeleton } from '@/features/nft-detail/components/nft-detail-skeleton';
import { NftGallery } from '@/features/nft-detail/components/nft-gallery';
import { NftInfoPanel } from '@/features/nft-detail/components/nft-info-panel';
import { RelatedCollection } from '@/features/nft-detail/components/related-collection';
import { DETAIL_COPY } from '@/features/nft-detail/constants/detail';
import { useCompactLayout } from '@/hooks/use-compact-layout';
import { useEditionOptions } from '@/features/nft-detail/hooks/use-edition-options';
import { useNftDetail } from '@/features/nft-detail/hooks/use-nft-detail';
import type {
  NftDetailDesktopProps,
  NftDetailScreenProps,
} from '@/features/nft-detail/types/detail-components';
import { isHttpError } from '@/lib/http';

/**
 * Faixa de conteúdo do frame de 1440.
 * O frame de 414 sangra na largura da tela e monta o próprio vão, por isso a
 * medida não sobe para a rota.
 */
const PAGE_CONTAINER = 'mx-auto max-w-(--container-page) px-4 py-6 md:px-6 xl:px-0';

/**
 * Tela de detalhe do NFT.
 *
 * Trata os quatro desfechos do acesso direto a uma URL: carregando (esqueleto),
 * inexistente (404 tratado, com saída para o catálogo), falha recuperável (com
 * nova tentativa) e sucesso. Assina `nft.updated` para que preço e
 * disponibilidade mudem enquanto a tela está aberta.
 *
 * A composição do sucesso e a do esqueleto dependem da faixa da janela: os dois
 * frames do Figma desenham telas diferentes, e só uma delas é montada (ver
 * `useCompactLayout`). Os estados de erro e "não encontrado" são iguais nos
 * dois e ficam na faixa de conteúdo comum.
 *
 * @param props - Id ou slug vindo da rota.
 */
export function NftDetailScreen({ nftId }: NftDetailScreenProps) {
  const detail = useNftDetail(nftId);
  const isCompact = useCompactLayout();

  useNftRealtime();

  if (detail.isPending) {
    return isCompact ? (
      <NftDetailMobileSkeleton />
    ) : (
      <div className={PAGE_CONTAINER}>
        <NftDetailSkeleton />
      </div>
    );
  }

  if (detail.isNotFound) {
    return (
      <div className={PAGE_CONTAINER}>
        <section
          data-testid="nft-not-found"
          className="flex flex-col items-center gap-4 py-24 text-center"
        >
          <h1 className="text-heading">{DETAIL_COPY.notFoundTitle}</h1>
          <p className="text-tan text-body max-w-prose">{DETAIL_COPY.notFoundDescription}</p>
          <Button asChild>
            <Link to={ROUTES.marketplace}>{DETAIL_COPY.notFoundAction}</Link>
          </Button>
        </section>
      </div>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <div className={PAGE_CONTAINER}>
        <section
          data-testid="nft-detail-error"
          role="alert"
          className="flex flex-col items-center gap-4 py-24 text-center"
        >
          <h1 className="text-heading">{DETAIL_COPY.errorTitle}</h1>
          <p className="text-tan text-body max-w-prose">
            {isHttpError(detail.error) ? detail.error.message : 'Erro inesperado ao falar com a API.'}
          </p>
          <Button onClick={detail.refetch}>{DETAIL_COPY.errorRetry}</Button>
        </section>
      </div>
    );
  }

  return isCompact ? (
    <NftDetailMobile nft={detail.data} />
  ) : (
    <div className={PAGE_CONTAINER}>
      <NftDetailDesktop nft={detail.data} />
    </div>
  );
}

/**
 * Composição do frame de 1440, com o recurso já carregado.
 *
 * Existe como componente próprio para que os hooks que dependem do NFT (edições
 * irmãs) não precisem conviver com os estados de carregamento e erro do recurso
 * principal.
 *
 * @param props - NFT carregado.
 */
function NftDetailDesktop({ nft }: NftDetailDesktopProps) {
  const editions = useEditionOptions(nft);

  return (
    <div className="flex flex-col gap-16">
      {/* A trilha e a galeria formam um bloco só: no frame ela desce e encosta
          na arte, em vez de flutuar no topo da página. */}
      <div className="flex flex-col gap-5 pt-6">
        <nav aria-label={DETAIL_COPY.breadcrumbLabel}>
          <ol className="text-bright flex items-center gap-2 text-[15px] leading-4 font-bold">
            <li>
              <Link to={ROUTES.home} className="rounded-control">
                Início
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link to={ROUTES.marketplace} className="rounded-control">
                {MARKETPLACE_COPY.title}
              </Link>
            </li>
          </ol>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2">
          <NftGallery images={nft.gallery} alt={nft.imageAlt} name={nft.name} />
          <NftInfoPanel nft={nft} />
        </div>
      </div>

      <DetailTabs nft={nft} />

      <RelatedCollection items={editions.related} isPending={editions.isPending} />
    </div>
  );
}
