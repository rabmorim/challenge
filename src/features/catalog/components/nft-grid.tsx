import { NftCard } from '@/features/catalog/components/nft-card';
import { CATALOG_COPY } from '@/features/catalog/constants/catalog-copy';
import type { NftGridProps } from '@/features/catalog/types/catalog-components';
import { cn } from '@/lib/utils';

/**
 * Grade de resultados.
 *
 * Três colunas no desktop (DESIGN_SPEC §4), duas no tablet e duas no celular,
 * com o deslocamento vertical alternado que o frame mobile mostra. Enquanto uma
 * consulta nova está em voo, a grade anterior continua visível com `aria-busy`
 * e contraste reduzido — é o estado de atualização em segundo plano, não um
 * carregamento do zero.
 *
 * @param props - Itens, favoritos e o estado de atualização.
 */
export function NftGrid({ items, favorites, isRefreshing }: NftGridProps) {
  return (
    <ul
      data-testid="nft-grid"
      aria-label={CATALOG_COPY.gridLabel}
      aria-busy={isRefreshing}
      className={cn(
        'grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-[88px]',
        isRefreshing && 'opacity-60',
      )}
    >
      {items.map((nft, index) => (
        <li
          key={nft.id}
          // O frame mobile alterna a altura das colunas; no desktop a grade é reta.
          className={index % 2 === 1 ? 'mt-8 lg:mt-0' : undefined}
        >
          <NftCard
            nft={nft}
            isFavorite={favorites.favoriteIds.has(nft.id)}
            isFavoritePending={favorites.pendingNftId === nft.id}
            onToggleFavorite={favorites.toggleFavorite}
            hasPriorityImage={index === 0}
          />
        </li>
      ))}
    </ul>
  );
}
