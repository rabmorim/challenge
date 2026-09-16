import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

import { FIRST_PAGE, PAGINATION_WINDOW } from '@/features/catalog/constants/catalog';
import { CATALOG_COPY } from '@/features/catalog/constants/catalog-copy';
import type { CatalogPaginationProps } from '@/features/catalog/types/catalog-components';
import { cn } from '@/lib/utils';

/**
 * Calcula a janela de páginas numeradas exibida.
 *
 * O design mostra quatro números e uma seta; com muitas páginas a janela
 * acompanha a página corrente em vez de listar tudo.
 *
 * @param page - Página atual.
 * @param totalPages - Total de páginas.
 * @returns Números de página a exibir, em ordem.
 */
function buildWindow(page: number, totalPages: number): number[] {
  const start = Math.max(FIRST_PAGE, Math.min(page - 1, totalPages - PAGINATION_WINDOW + 1));
  const end = Math.min(totalPages, start + PAGINATION_WINDOW - 1);

  return Array.from({ length: Math.max(0, end - start + 1) }, (_unused, index) => start + index);
}

/**
 * Paginação numérica do catálogo.
 *
 * É uma `nav` com botões de verdade (não `div` clicável): cada página é
 * alcançável por teclado e a atual é anunciada com `aria-current`. A troca de
 * página escreve na URL, então voltar pelo histórico devolve a página anterior.
 *
 * @param props - Página atual, total e o que fazer na troca.
 */
export function CatalogPagination({ page, totalPages, onChange }: CatalogPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label={CATALOG_COPY.paginationLabel} data-testid="catalog-pagination">
      <ul className="flex items-center justify-end gap-2">
        {page > FIRST_PAGE && (
          <li>
            <button
              type="button"
              aria-label={CATALOG_COPY.previousPage}
              onClick={() => {
                onChange(page - 1);
              }}
              className="border-input text-foreground rounded-control flex size-9 cursor-pointer items-center justify-center border"
            >
              <ChevronLeftIcon className="size-4" aria-hidden="true" />
            </button>
          </li>
        )}

        {buildWindow(page, totalPages).map((candidate) => (
          <li key={candidate}>
            <button
              type="button"
              aria-label={`Página ${String(candidate)}`}
              aria-current={candidate === page ? 'page' : undefined}
              onClick={() => {
                onChange(candidate);
              }}
              className={cn(
                'text-body-lg rounded-control flex size-9 cursor-pointer items-center justify-center border',
                candidate === page
                  ? 'bg-primary text-primary-foreground border-primary font-bold'
                  : 'border-input text-foreground',
              )}
            >
              {candidate}
            </button>
          </li>
        ))}

        {page < totalPages && (
          <li>
            <button
              type="button"
              aria-label={CATALOG_COPY.nextPage}
              onClick={() => {
                onChange(page + 1);
              }}
              className="border-input text-foreground rounded-control flex size-9 cursor-pointer items-center justify-center border"
            >
              <ChevronRightIcon className="size-4" aria-hidden="true" />
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}
