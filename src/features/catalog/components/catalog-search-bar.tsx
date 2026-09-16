import { CatalogFiltersDrawer } from '@/features/catalog/components/catalog-filters-drawer';
import { CatalogSearchField } from '@/features/catalog/components/catalog-search-field';
import { useCatalogSearch } from '@/features/catalog/hooks/use-catalog-search';
import { useNftList } from '@/features/catalog/hooks/use-nft-list';

/**
 * Linha de busca do topo do celular: campo em largura total + botão de filtros.
 *
 * É a primeira coisa da Início no frame de 414, acima do herói — por isso ela
 * mora na rota, e não dentro do bloco de catálogo. Os dois controles somam os
 * 366px do frame (313 + 8 + 45) e aqui acompanham a largura disponível.
 *
 * As facetas vêm da mesma consulta que alimenta a grade: a query key é a mesma,
 * então o TanStack Query serve as duas leituras do mesmo cache — nenhuma
 * requisição a mais por montar a barra fora do `CatalogSection`.
 */
export function CatalogSearchBar() {
  const catalog = useCatalogSearch();
  const list = useNftList(catalog.params);

  return (
    <div data-testid="catalog-search-bar" className="flex items-center gap-2 lg:hidden">
      <CatalogSearchField />
      <CatalogFiltersDrawer
        catalog={catalog}
        facets={list.data?.facets ?? null}
        isPending={list.isPending}
      />
    </div>
  );
}
