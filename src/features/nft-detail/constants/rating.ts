/** Quantidade de estrelas da escala de avaliação. */
export const MAX_STARS = 5;

/** Idioma usado na formatação das datas das avaliações. */
export const REVIEW_DATE_LOCALE = 'pt-BR';

/**
 * Formato da data das avaliações.
 * Fuso UTC de propósito: a data vem do servidor simulado em ISO e não pode
 * mudar conforme o fuso da máquina, ou a regressão visual ficaria instável.
 */
export const REVIEW_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
};
