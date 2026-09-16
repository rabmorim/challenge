import { CatalogSortMenu } from '@/features/catalog/components/catalog-sort-menu';
import { CatalogTabs } from '@/features/catalog/components/catalog-tabs';
import type { CatalogToolbarProps } from '@/features/catalog/types/catalog-components';

/**
 * Barra acima da grade: recorte do catálogo e ordenação.
 *
 * O frame de 414 mostra só as abas — a ordenação sobe para a gaveta de filtros
 * em celulares (`CatalogFiltersDrawer`), que é onde o resto da consulta já é
 * ajustado. A partir de `lg` os dois controles voltam para a mesma linha, como
 * no frame de 1440.
 *
 * @param props - Estado de URL do catálogo.
 */
export function CatalogToolbar({ catalog }: CatalogToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <CatalogTabs catalog={catalog} />

      <div className="hidden lg:block">
        <CatalogSortMenu catalog={catalog} />
      </div>
    </div>
  );
}
