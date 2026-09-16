/**
 * Formato da data do recibo.
 *
 * Fixo em pt-BR (e nao no locale do navegador) porque a tela de confirmacao
 * entra na regressao visual: uma data que muda de idioma conforme a maquina
 * quebraria a baseline sem nenhuma mudanca de codigo.
 */

/** Locale usado na data do recibo. */
export const RECEIPT_DATE_LOCALE = 'pt-BR';

/** Partes da data exibidas no frame (`29 Jul, 2026`). */
export const RECEIPT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
};
