import { StarRating } from '@/features/nft-detail/components/star-rating';
import { DETAIL_COPY } from '@/features/nft-detail/constants/detail';
import type { ReviewListProps } from '@/features/nft-detail/types/detail-components';
import { formatReviewDate } from '@/features/nft-detail/lib/format-review-date';

/**
 * Avaliações de colecionadores.
 *
 * Lista o que vem no detalhe do NFT; sem avaliações, diz isso em vez de mostrar
 * uma área vazia. A data é formatada em pt-BR a partir do ISO da API.
 *
 * @param props - Avaliações e a nota agregada do item.
 */
export function ReviewList({ reviews, rating }: ReviewListProps) {
  if (reviews.length === 0) {
    return <p className="text-tan text-body">{DETAIL_COPY.reviewsEmpty}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <StarRating average={rating.average} count={rating.count} withValue />

      <ul className="flex flex-col gap-4">
        {reviews.map((review) => (
          <li key={review.id} className="bg-card rounded-panel flex flex-col gap-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-body-lg font-bold">{review.author}</span>
              <time className="text-tan text-body" dateTime={review.createdAt}>
                {formatReviewDate(review.createdAt)}
              </time>
            </div>

            <StarRating average={String(review.rating)} />
            <p className="text-tan text-body">{review.comment}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
