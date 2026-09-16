import { createFileRoute } from '@tanstack/react-router';

import { ROUTE_SEO } from '@/constants/seo';
import { routeHead } from '@/lib/route-head';

import { nftListQueryOptions } from '@/features/catalog/api/catalog-queries';
import { CatalogSearchBar } from '@/features/catalog/components/catalog-search-bar';
import { CatalogSection } from '@/features/catalog/components/catalog-section';
import { HeroBanner } from '@/features/catalog/components/hero-banner';
import { JournalSection } from '@/features/catalog/components/journal-section';
import { PromoSection } from '@/features/catalog/components/promo-section';
import { validateCatalogSearch } from '@/features/catalog/lib/catalog-search';
import { toListParams } from '@/features/catalog/lib/catalog-search';

/**
 * Início: herói, catálogo completo, promoções e diário.
 *
 * O estado de busca/filtros/ordenação/paginação é validado aqui (`validateSearch`)
 * e consumido pelos componentes do catálogo — a mesma composição que o Mercado
 * usa, com o conteúdo editorial ao redor.
 *
 * O frame de 414 abre pela linha de busca (o header não existe em celulares) e
 * empilha herói, abas e grade com 16px entre eles; o de 1440 mantém os vãos
 * largos das seções. As seções editoriais não estão em nenhum frame mobile,
 * então ganham um respiro maior antes delas — `md:contents` as devolve ao vão
 * do container assim que ele passa a valer.
 */
function HomeRoute() {
  return (
    <div className="mx-auto flex max-w-(--container-page) flex-col gap-4 px-6 py-6 md:gap-16 lg:gap-24 xl:px-0">
      <CatalogSearchBar />

      <HeroBanner />
      <CatalogSection withFeatured />

      <div className="mt-8 flex flex-col gap-8 md:contents">
        <PromoSection />
        <JournalSection />
      </div>
    </div>
  );
}

export const Route = createFileRoute('/')({
  head: () => routeHead(ROUTE_SEO.home),
  validateSearch: validateCatalogSearch,
  // Aquece o cache sem bloquear a navegação: o esqueleto aparece de imediato e
  // a listagem chega por cima. Em `preload` (foco/ponteiro) a resposta costuma
  // já estar pronta quando a rota abre.
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ context, deps }) => {
    void context.queryClient.prefetchQuery(nftListQueryOptions(toListParams(deps.search)));
  },
  component: HomeRoute,
});
