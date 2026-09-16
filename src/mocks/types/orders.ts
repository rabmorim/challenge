import type { Order } from '@/features/checkout/types/order';
import type { ApiErrorReason, AvailabilityConflict } from '@/types/api';

/**
 * Resultados das operacoes de pedido no servidor simulado.
 * Tipos discriminados mantem o handler burro: ele traduz a falha no erro HTTP
 * correspondente sem inspecionar mensagem nenhuma.
 */

/**
 * Falha na criacao de um pedido.
 *
 * `fieldErrors` presente significa erro de formulario (o handler responde 422);
 * caso contrario a falha e de estado e `reason` diz qual conflito ocorreu.
 */
export interface OrderFailure {
  reason?: ApiErrorReason;
  message: string;
  /** Itens divergentes, quando a falha e de preco/disponibilidade. */
  conflicts?: AvailabilityConflict[];
  /** Erros por campo, quando a falha e de validacao do formulario. */
  fieldErrors?: Record<string, string>;
}

/**
 * Criacao de pedido.
 * `replayed` indica que a chave de idempotencia recuperou um pedido existente
 * em vez de criar outro — e o que o cliente usa depois de um timeout.
 */
export type OrderCreationResult =
  | { ok: true; order: Order; replayed: boolean }
  | { ok: false; failure: OrderFailure };
