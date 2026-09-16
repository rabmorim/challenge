import { DEFAULT_TAB, TAB_LABELS } from '@/features/catalog/constants/catalog';
import { CATALOG_COPY } from '@/features/catalog/constants/catalog-copy';
import { isTab } from '@/features/catalog/lib/catalog-search';
import type { CatalogToolbarProps } from '@/features/catalog/types/catalog-components';
import { cn } from '@/lib/utils';

/**
 * Recorte do catálogo: "Todos os NFTs", "Novos lançamentos" e "Em alta".
 *
 * São botões de alternância (`aria-pressed`), e não um `tablist`: o que eles
 * mudam é a **consulta** — a lista é a mesma região, recarregada com outros
 * parâmetros, e o resultado vai para a URL. Um `tablist` prometeria painéis
 * distintos (e exige `aria-controls` apontando para cada um), o que aqui seria
 * uma promessa falsa ao leitor de tela.
 *
 * @param props - Estado de URL do catálogo.
 */
export function CatalogTabs({ catalog }: CatalogToolbarProps) {
  const activeTab = catalog.search.tab ?? DEFAULT_TAB;

  return (
    <ul aria-label={CATALOG_COPY.tabsLabel} className="flex max-w-full gap-5 overflow-x-auto lg:gap-6">
      {Object.entries(TAB_LABELS).map(([tab, label]) => (
        <li key={tab}>
          <button
            type="button"
            aria-pressed={tab === activeTab}
            onClick={() => {
              if (isTab(tab)) catalog.setTab(tab);
            }}
            className={cn(
              'text-body shrink-0 cursor-pointer whitespace-nowrap border-b-2 border-b-transparent lg:pb-1 lg:text-body-lg',
              tab === activeTab ? 'border-b-primary text-primary' : 'text-foreground',
            )}
          >
            {label}
          </button>
        </li>
      ))}
    </ul>
  );
}
