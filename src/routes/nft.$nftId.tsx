import { createFileRoute } from '@tanstack/react-router';

import { ROUTE_SEO } from '@/constants/seo';
import { routeHead } from '@/lib/route-head';

import { nftDetailQueryOptions } from '@/features/catalog/api/catalog-queries';
import { NftDetailScreen } from '@/features/nft-detail/components/nft-detail-screen';

/**
 * Detalhe do NFT, por id ou slug.
 *
 * O acesso direto à URL funciona porque a tela resolve o recurso sozinha: o
 * `loader` só aquece o cache (sem bloquear a navegação nem lançar), e é a tela
 * que decide entre esqueleto, "não encontrado", falha recuperável e sucesso.
 *
 * A rota não desenha faixa nem vão: o frame de 414 sangra na largura da tela, e
 * quem monta o container do frame de 1440 é a própria tela.
 */
function NftDetailRoute() {
  const { nftId } = Route.useParams();

  return <NftDetailScreen nftId={nftId} />;
}

export const Route = createFileRoute('/nft/$nftId')({
  head: () => routeHead(ROUTE_SEO.nftDetail),
  loader: ({ context, params }) => {
    void context.queryClient.prefetchQuery(nftDetailQueryOptions(params.nftId));
  },
  component: NftDetailRoute,
});
