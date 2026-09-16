import type { Quote } from '@/features/checkout/types/quote';
import type { ApiErrorReason, AvailabilityConflict } from '@/types/api';

/**
 * Resultado de uma cotacao no servidor simulado.
 * Um tipo discriminado (e nao excecoes) mantem o handler simples: ele traduz a
 * falha no erro HTTP correspondente sem inspecionar mensagens.
 */

/** Falha de cotacao, com o material que a interface precisa para explicar. */
export interface QuoteFailure {
  reason: ApiErrorReason;
  message: string;
  /** Itens divergentes, quando a falha e de preco/disponibilidade. */
  conflicts?: AvailabilityConflict[];
  /** Campo do formulario responsavel, quando aplicavel (ex.: `couponCode`). */
  field?: string;
}

/** Cotacao bem-sucedida ou falha. */
export type QuoteResult = { ok: true; quote: Quote } | { ok: false; failure: QuoteFailure };
