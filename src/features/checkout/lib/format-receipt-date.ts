import {
  RECEIPT_DATE_LOCALE,
  RECEIPT_DATE_OPTIONS,
} from '@/features/checkout/constants/receipt-date';
import type { IsoDateTime } from '@/types/api';

/**
 * Formata a data do recibo no formato do frame (`29 Jul, 2026`).
 *
 * O `Intl` de pt-BR devolve `29 de jul. de 2026`; o frame usa a forma curta em
 * caixa alta inicial e sem preposicoes, entao as partes sao remontadas a mao a
 * partir do que o `Intl` separou — assim o nome do mes continua vindo da
 * biblioteca (e localizado), sem uma tabela de meses escrita no projeto.
 *
 * @param isoDate - Data em ISO 8601 vinda da API.
 * @returns Data formatada, ex.: `29 Jul, 2026`.
 */
export function formatReceiptDate(isoDate: IsoDateTime): string {
  const parts = new Intl.DateTimeFormat(RECEIPT_DATE_LOCALE, RECEIPT_DATE_OPTIONS).formatToParts(
    new Date(isoDate),
  );

  const read = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? '';

  const month = read('month').replace('.', '');
  const capitalized = month.charAt(0).toUpperCase() + month.slice(1);

  return `${read('day')} ${capitalized}, ${read('year')}`;
}
