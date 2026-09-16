import { createFileRoute } from '@tanstack/react-router';

import { ROUTE_SEO } from '@/constants/seo';
import { routeHead } from '@/lib/route-head';

import { nftListQueryOptions } from '@/features/catalog/api/catalog-queries';
import { CatalogSearchBar } from '@/features/catalog/components/catalog-search-bar';
import { CatalogSection } from '@/features/catalog/components/catalog-section';
import { MARKETPLACE_COPY } from '@/features/catalog/constants/catalog-copy';
import { toListParams, validateCatalogSearch } from '@/features/catalog/lib/catalog-search';

/**
 * Mercado: o catálogo em tela cheia, sem o conteúdo editorial da Início.
 *
 * É o destino do item "Mercado" do menu e do que as buscas do header produzem.
 * Compartilha componentes e schema de busca com a Início — o estado mora na
 * URL, então as duas rotas se comportam igual sem compartilhar estado local.
 */
function MarketplaceRoute() {
  return (
    <div className="mx-auto flex max-w-(--container-page) flex-col gap-8 px-6 py-6 xl:px-0">
      <CatalogSearchBar />

      <header className="flex flex-col gap-2">
        <h1 className="text-heading">{MARKETPLACE_COPY.title}</h1>
        <p className="text-tan text-body max-w-prose">{MARKETPLACE_COPY.description}</p>
      </header>

      <CatalogSection />
    </div>
  );
}

export const Route = createFileRoute('/mercado')({
  head: () => routeHead(ROUTE_SEO.marketplace),
  validateSearch: validateCatalogSearch,
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ context, deps }) => {
    void context.queryClient.prefetchQuery(nftListQueryOptions(toListParams(deps.search)));
  },
  component: MarketplaceRoute,
});
