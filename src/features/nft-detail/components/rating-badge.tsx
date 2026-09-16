import { StarIcon } from 'lucide-react';

import { DETAIL_COPY } from '@/features/nft-detail/constants/detail';
import type { RatingBadgeProps } from '@/features/nft-detail/types/detail-components';

/**
 * Selo de nota do frame de 414 — a cápsula `★ 4.8(19)` ao lado do título.
 *
 * A estrela e os números são decorativos: uma forma preenchida e um par de
 * parênteses não dizem "nota 4,8 de 5 em 19 avaliações", então o selo inteiro é
 * anunciado por um texto só, escrito por extenso.
 *
 * @param props - Média em string decimal e total de avaliações.
 */
export function RatingBadge({ average, count }: RatingBadgeProps) {
  return (
    <span
      data-testid="rating-badge"
      className="border-primary flex h-[27px] shrink-0 items-center gap-1 rounded-full border px-1"
    >
      <span className="sr-only">
        {DETAIL_COPY.ratingLabel(average)}. {DETAIL_COPY.ratingSummary(count)}.
      </span>

      <StarIcon className="fill-primary text-primary size-3 shrink-0" aria-hidden="true" />

      <span aria-hidden="true" className="text-[14px] leading-4 font-medium">
        {average}
      </span>

      <span aria-hidden="true" className="text-tan -ml-1 text-[14px] leading-4">
        ({count})
      </span>
    </span>
  );
}
