import { ChevronLeftIcon } from 'lucide-react';

import { FavoriteButton } from '@/features/catalog/components/favorite-button';
import { useFavorites } from '@/features/catalog/hooks/use-favorites';
import { DETAIL_COPY } from '@/features/nft-detail/constants/detail';
import { useBackNavigation } from '@/hooks/use-back-navigation';
import type { DetailTopBarProps } from '@/features/nft-detail/types/detail-components';

/**
 * Linha de voltar e favoritar do frame de 414, sobre o degradê da arte.
 *
 * As duas bolinhas de 35px são controles reais: a seta usa o histórico do
 * router (ver `useBackNavigation`) e o coração é o mesmo botão otimista do
 * catálogo, na variante circular.
 *
 * @param props - NFT exibido.
 */
export function DetailTopBar({ nft }: DetailTopBarProps) {
  const back = useBackNavigation();
  const favorites = useFavorites();

  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        data-testid="detail-back"
        aria-label={DETAIL_COPY.back}
        onClick={back.goBack}
        className="border-border bg-surface-lift text-tan flex size-[35px] cursor-pointer items-center justify-center rounded-full border"
      >
        <ChevronLeftIcon className="size-5" aria-hidden="true" />
      </button>

      <FavoriteButton
        nftId={nft.id}
        nftName={nft.name}
        isFavorite={favorites.favoriteIds.has(nft.id)}
        isPending={favorites.pendingNftId === nft.id}
        onToggle={favorites.toggleFavorite}
        variant="circle"
      />

      {/* Região viva: a alternância de favorito precisa ser percebida por quem
          não vê o coração mudar de estado. */}
      <output className="sr-only" aria-live="polite">
        {favorites.announcement}
      </output>
    </div>
  );
}
