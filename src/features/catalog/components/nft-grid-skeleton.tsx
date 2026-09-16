import { DEFAULT_PAGE_SIZE } from '@/features/catalog/constants/catalog';
import { CATALOG_COPY } from '@/features/catalog/constants/catalog-copy';

/**
 * Esqueleto da grade.
 *
 * Ocupa a mesma caixa do card real (arte quadrada, duas linhas de texto), para
 * que a chegada dos dados não desloque nada. O shimmer vem da classe
 * `.skeleton` do tema, que a preferência por movimento reduzido congela.
 */
export function NftGridSkeleton() {
  return (
    <output
      data-testid="nft-grid-skeleton"
      aria-label={CATALOG_COPY.loading}
      className="grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-[88px]"
    >
      {Array.from({ length: DEFAULT_PAGE_SIZE }, (_unused, index) => (
        // Placeholders são posicionais: o índice é o único identificador que existe.
        <div key={index} className="flex flex-col">
          <div className="surface-gradient rounded-card-mobile lg:bg-card lg:rounded-card border-t-2 border-t-transparent px-1 pt-3 pb-5 lg:bg-none lg:pt-6 lg:pb-6">
            <div className="skeleton rounded-media lg:rounded-card mx-auto aspect-square w-full max-w-[250px]" />
          </div>
          <div className="flex flex-col gap-2.5 px-2 pt-2.5 lg:px-1 lg:pt-4">
            <div className="skeleton h-4 w-3/4 rounded-sm" />
            <div className="skeleton h-4 w-1/3 rounded-sm" />
          </div>
        </div>
      ))}
    </output>
  );
}
