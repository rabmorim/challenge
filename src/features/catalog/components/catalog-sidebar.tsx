import { isNetworkId } from '@/constants/network';
import { Button } from '@/components/ui/button';
import { FacetFilter } from '@/features/catalog/components/facet-filter';
import { PriceFilter } from '@/features/catalog/components/price-filter';
import { CATALOG_COPY } from '@/features/catalog/constants/catalog-copy';
import type { CatalogSidebarProps } from '@/features/catalog/types/catalog-components';

/**
 * Sidebar de filtros do catálogo.
 *
 * Composição do DESIGN_SPEC §4: coleções com contagem, faixa de preço com
 * "Aplicar" e redes — nesta ordem, em uma superfície `#241612` com 20px de
 * padding. O frame não desenha um filtro de raridade, então ele não existe
 * aqui; a raridade continua sendo um parâmetro válido da busca (é o recorte do
 * cartão "Lançamentos gênesis"), só não tem controle próprio na coluna.
 *
 * Os rótulos e as contagens vêm das facetas da API; nenhuma lista é fixa aqui.
 *
 * @param props - Estado de URL, facetas da resposta e o estado de carregamento.
 */
export function CatalogSidebar({ catalog, facets, isPending }: CatalogSidebarProps) {
  return (
    <aside
      data-testid="catalog-sidebar"
      aria-label={CATALOG_COPY.sidebarLabel}
      className="bg-card rounded-panel flex flex-col gap-7 p-5"
    >
      <FacetFilter
        title={CATALOG_COPY.collectionsTitle}
        options={facets?.collections ?? []}
        selected={catalog.search.collections ?? []}
        onToggle={catalog.toggleCollection}
        isPending={isPending}
      />

      <PriceFilter
        range={facets?.priceRange ?? null}
        selectedMin={catalog.search.priceMin}
        selectedMax={catalog.search.priceMax}
        onApply={(min, max) => {
          catalog.setPriceRange(min, max);
        }}
        isPending={isPending}
      />

      <FacetFilter
        title={CATALOG_COPY.networksTitle}
        options={facets?.networks ?? []}
        selected={catalog.search.networks ?? []}
        onToggle={(id) => {
          // O id vem da faceta do servidor; o guard mantém o contrato fechado.
          if (isNetworkId(id)) catalog.toggleNetwork(id);
        }}
        isPending={isPending}
      />

      {catalog.hasFilters && (
        <Button variant="outline" size="sm" onClick={catalog.clearFilters} className="w-full">
          {CATALOG_COPY.clearFilters}
        </Button>
      )}
    </aside>
  );
}
