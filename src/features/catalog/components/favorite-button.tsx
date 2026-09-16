import { HeartIcon } from 'lucide-react';

import { FAVORITES_COPY } from '@/features/catalog/constants/favorites';
import type { FavoriteButtonProps } from '@/features/catalog/types/catalog-components';
import { cn } from '@/lib/utils';

/**
 * Botão de favoritar.
 *
 * O estado não depende só de cor: além do preenchimento do coração, o botão
 * carrega `aria-pressed` e um rótulo que diz o que a ação fará. Enquanto a
 * mutation corre, só **este** botão fica desabilitado — favoritar outro item ao
 * mesmo tempo continua possível.
 *
 * @param props - NFT alvo, estado atual e o alternador vindo do hook.
 */
export function FavoriteButton({
  nftId,
  nftName,
  isFavorite,
  isPending,
  onToggle,
  variant = 'overlay',
}: FavoriteButtonProps) {
  const label = `${isFavorite ? FAVORITES_COPY.remove : FAVORITES_COPY.add}: ${nftName}`;

  return (
    <button
      type="button"
      data-testid="favorite-button"
      data-nft={nftId}
      aria-pressed={isFavorite}
      aria-label={label}
      title={label}
      disabled={isPending}
      onClick={() => {
        onToggle(nftId);
      }}
      className={cn(
        'relative flex items-center justify-center disabled:opacity-60',
        // Selo redondo de 28px no frame de 414 e quadrado de 36px no de 1440.
        // O `before` amplia só a área de toque, sem alargar o selo.
        variant === 'overlay' &&
          'bg-surface-lift text-primary size-[28px] cursor-pointer rounded-full before:absolute before:-inset-2 before:content-[""] lg:bg-background/85 lg:text-foreground lg:rounded-control lg:size-9 lg:before:hidden',
        // Contorno do frame de detalhe: texto e borda no mesmo tom do link.
        variant === 'outline' &&
          'border-link text-link text-body rounded-button h-11 cursor-pointer gap-2 border px-5',
        variant === 'bare' && 'text-foreground size-9 cursor-pointer',
        // Bolinha de 35px do frame de detalhe em celulares, sobre a arte.
        variant === 'circle' &&
          'border-border bg-surface-lift text-link size-[35px] cursor-pointer rounded-full border',
      )}
    >
      <HeartIcon
        className={cn(
          'size-5',
          variant === 'overlay' && 'size-4 lg:size-5',
          variant === 'circle' && 'size-4',
          isFavorite && 'fill-current',
          isFavorite && variant !== 'circle' && 'text-primary',
        )}
        aria-hidden="true"
      />
      {variant === 'outline' && <span>{isFavorite ? 'Favoritado' : 'Favoritar'}</span>}
    </button>
  );
}
