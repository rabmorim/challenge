import type { NftRating, NftReview } from '@/features/catalog/types/nft';
import { REVIEW_AUTHORS, REVIEW_COMMENTS, REVIEW_EPOCH } from '@/mocks/constants';
import { stableHash } from '@/mocks/lib/hash';

/**
 * Avaliações de colecionadores — a segunda aba do detalhe.
 *
 * São derivadas do slug por hash estável em vez de escritas uma a uma: o
 * catálogo tem 24 itens e a tela precisa de nota, contagem e comentários
 * coerentes entre si. Determinístico entre execuções, então a regressão visual
 * e os testes não dependem de sorteio nem do relógio da máquina.
 */

/** Nota mínima atribuída a uma avaliação gerada. */
const MIN_REVIEW_RATING = 3;

/** Nota máxima possível. */
const MAX_REVIEW_RATING = 5;

/** Quantidade mínima de avaliações de um item. */
const MIN_REVIEW_COUNT = 4;

/** Variação possível sobre o mínimo (o item mais avaliado chega a 27). */
const REVIEW_COUNT_RANGE = 24;

/** Quantidade de comentários efetivamente listados na aba. */
const LISTED_REVIEWS = 3;

/** Intervalo (ms) entre uma avaliação listada e a anterior — um dia. */
const REVIEW_INTERVAL_MS = 24 * 60 * 60_000;

/** Casas decimais da média exibida ao lado do preço. */
const AVERAGE_DECIMAL_PLACES = 1;

/**
 * Converte o hash do slug em um inteiro utilizável como semente.
 *
 * @param slug - Slug do NFT.
 * @param salt - Diferencia as grandezas derivadas do mesmo slug.
 * @returns Inteiro não negativo determinístico.
 */
function seed(slug: string, salt: string): number {
  return Number.parseInt(stableHash(`${slug}:${salt}`), 16);
}

/**
 * Monta as avaliações listadas de um NFT.
 *
 * @param slug - Slug do NFT, usado como semente.
 * @returns Avaliações em ordem decrescente de data.
 */
export function buildReviews(slug: string): NftReview[] {
  return Array.from({ length: LISTED_REVIEWS }, (_unused, index) => {
    const authorSeed = seed(slug, `author-${String(index)}`);
    const commentSeed = seed(slug, `comment-${String(index)}`);
    const ratingSeed = seed(slug, `rating-${String(index)}`);

    return {
      id: `${slug}-review-${String(index + 1)}`,
      author: REVIEW_AUTHORS[authorSeed % REVIEW_AUTHORS.length] ?? REVIEW_AUTHORS[0],
      rating: MIN_REVIEW_RATING + (ratingSeed % (MAX_REVIEW_RATING - MIN_REVIEW_RATING + 1)),
      comment: REVIEW_COMMENTS[commentSeed % REVIEW_COMMENTS.length] ?? REVIEW_COMMENTS[0],
      createdAt: new Date(REVIEW_EPOCH - index * REVIEW_INTERVAL_MS).toISOString(),
    } satisfies NftReview;
  });
}

/**
 * Calcula a nota agregada de um NFT.
 *
 * A contagem é maior que o número de comentários listados (a aba mostra os três
 * mais recentes de um total), e a média sai das notas geradas — os dois números
 * não podem se contradizer na tela.
 *
 * @param slug - Slug do NFT.
 * @param reviews - Avaliações listadas do mesmo item.
 * @param count - Total exato, quando a peça é uma das desenhadas no Figma.
 * @returns Média em string decimal e total de avaliações.
 */
export function buildRating(slug: string, reviews: NftReview[], count?: number): NftRating {
  const average =
    reviews.reduce((total, review) => total + review.rating, 0) / Math.max(1, reviews.length);

  return {
    average: average.toFixed(AVERAGE_DECIMAL_PLACES),
    count: count ?? MIN_REVIEW_COUNT + (seed(slug, 'count') % REVIEW_COUNT_RANGE),
  };
}
