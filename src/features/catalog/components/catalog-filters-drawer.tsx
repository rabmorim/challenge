import { Settings2Icon, XIcon } from 'lucide-react';
import { useState } from 'react';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CatalogSidebar } from '@/features/catalog/components/catalog-sidebar';
import { CatalogSortMenu } from '@/features/catalog/components/catalog-sort-menu';
import { CATALOG_COPY } from '@/features/catalog/constants/catalog-copy';
import { countActiveFilters } from '@/features/catalog/lib/catalog-search';
import type { CatalogSidebarProps } from '@/features/catalog/types/catalog-components';

/**
 * Filtros em gaveta, para telas estreitas.
 *
 * O frame de 414 troca a coluna de filtros por um botão de 45px ao lado da
 * busca — quadrado de raio 14 com o degrade do acento. A gaveta é um diálogo do
 * Radix, então foco preso, `Esc` e devolução do foco ao gatilho vêm de graça —
 * requisitos do enunciado §8 que uma `div` deslizante não teria.
 *
 * A ordenação entra aqui porque o frame não a desenha ao lado das abas em
 * celulares: escondê-la sem destino a tornaria inalcançável no toque.
 *
 * O gatilho anuncia quantos filtros estão ativos e marca o estado com um ponto,
 * não só com cor: escondida atrás de um botão, a seleção precisa continuar
 * visível, senão o resultado parece errado sem explicação.
 *
 * @param props - As mesmas props da sidebar, repassadas ao conteúdo.
 */
export function CatalogFiltersDrawer({ catalog, facets, isPending }: CatalogSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const activeCount = countActiveFilters(catalog.search);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="accent-gradient text-primary-foreground rounded-filter relative flex size-[45px] shrink-0 cursor-pointer items-center justify-center"
        >
          <Settings2Icon className="size-5" aria-hidden="true" />
          {/* O frame desenha só o glifo; o nome da ação vive no rótulo. */}
          <span className="sr-only">{CATALOG_COPY.filtersTrigger}</span>
          {activeCount > 0 && (
            <>
              <span
                aria-hidden="true"
                className="bg-primary-foreground absolute top-1.5 right-1.5 size-1.5 rounded-full"
              />
              <span className="sr-only">
                {activeCount} {CATALOG_COPY.filtersActive}
              </span>
            </>
          )}
        </button>
      </DialogTrigger>

      <DialogContent className="rounded-t-panel inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto p-4">
        <div className="mb-4 flex items-center justify-between gap-4">
          <DialogTitle className="text-title">{CATALOG_COPY.filtersTitle}</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" aria-label={CATALOG_COPY.filtersClose}>
              <XIcon className="size-5" aria-hidden="true" />
            </Button>
          </DialogClose>
        </div>

        <DialogDescription className="sr-only">{CATALOG_COPY.filtersDescription}</DialogDescription>

        <div className="mb-2 flex justify-start">
          <CatalogSortMenu catalog={catalog} />
        </div>

        <CatalogSidebar catalog={catalog} facets={facets} isPending={isPending} />

        <DialogClose asChild>
          <Button className="mt-4 w-full">{CATALOG_COPY.filtersApply}</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
