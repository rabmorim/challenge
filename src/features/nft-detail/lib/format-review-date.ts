import { REVIEW_DATE_LOCALE, REVIEW_DATE_OPTIONS } from '@/features/nft-detail/constants/rating';

/**
 * Formata a data de uma avaliação para exibição.
 *
 * A API entrega ISO 8601 (e o `time` do HTML guarda esse valor em `dateTime`);
 * a tela mostra a data por extenso em pt-BR.
 *
 * @param isoDate - Data em ISO 8601 vinda da API.
 * @returns Data formatada, ex.: `24 de fevereiro de 2026`.
 */
export function formatReviewDate(isoDate: string): string {
  return new Intl.DateTimeFormat(REVIEW_DATE_LOCALE, REVIEW_DATE_OPTIONS).format(
    new Date(isoDate),
  );
}
