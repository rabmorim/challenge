import { ChevronDownIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DEFAULT_SORT, SORT_OPTION_LABELS } from '@/features/catalog/constants/catalog';
import { CATALOG_COPY } from '@/features/catalog/constants/catalog-copy';
import { isSortOption } from '@/features/catalog/lib/catalog-search';
import type { CatalogToolbarProps } from '@/features/catalog/types/catalog-components';

/**
 * Ordenação do catálogo.
 *
 * É um menu de opções exclusivas (`menuitemradio`), com a escolhida marcada por
 * ícone além da cor — e, como tudo mais nesta tela, escreve na URL em vez de
 * ficar em estado local.
 *
 * Vive fora da barra de abas porque o frame de 414 não desenha ordenação ao
 * lado das abas: em celulares ela entra na gaveta de filtros, e é o mesmo
 * componente nos dois lugares.
 *
 * @param props - Estado de URL do catálogo.
 */
export function CatalogSortMenu({ catalog }: CatalogToolbarProps) {
  const activeSort = catalog.search.sort ?? DEFAULT_SORT;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-body lg:text-body-lg min-h-11 gap-1 px-0"
        >
          <span className="text-foreground">{CATALOG_COPY.sortLabel}</span>
          <span>{SORT_OPTION_LABELS[activeSort]}</span>
          <ChevronDownIcon className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={activeSort}
          onValueChange={(value) => {
            if (isSortOption(value)) catalog.setSort(value);
          }}
        >
          {Object.entries(SORT_OPTION_LABELS).map(([option, label]) => (
            <DropdownMenuRadioItem key={option} value={option}>
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
