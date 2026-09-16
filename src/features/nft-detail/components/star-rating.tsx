import { StarIcon } from 'lucide-react';

import { MAX_STARS } from '@/features/nft-detail/constants/rating';
import { DETAIL_COPY } from '@/features/nft-detail/constants/detail';
import type { StarRatingProps } from '@/features/nft-detail/types/detail-components';
import { cn } from '@/lib/utils';

/**
 * Nota em estrelas.
 *
 * As estrelas são decorativas (`aria-hidden`) e a nota vai em texto no rótulo:
 * uma fileira de ícones não comunica "4,8 de 5" a quem usa leitor de tela, e o
 * estado não pode depender só da forma preenchida.
 *
 * @param props - Média, contagem e se a média aparece escrita.
 */
export function StarRating({ average, count, withValue = false }: StarRatingProps) {
  const filled = Math.round(Number(average));

  return (
    <span className="flex items-center gap-2">
      <span className="flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: MAX_STARS }, (_unused, index) => (
          <StarIcon
            key={index}
            className={cn('size-4', index < filled ? 'fill-primary text-primary' : 'text-tan')}
          />
        ))}
      </span>

      <span className="sr-only">{DETAIL_COPY.ratingLabel(average)}</span>

      {withValue && <span className="text-body font-bold">{average}</span>}

      {count !== undefined && (
        <span className="text-foreground text-body-lg">{DETAIL_COPY.ratingSummary(count)}</span>
      )}
    </span>
  );
}
