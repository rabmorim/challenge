import type { OrderDeclineReason } from '@/features/checkout/types/order';
import { transitionOrder } from '@/mocks/db/orders';
import { getDatabase } from '@/mocks/db/store';

/**
 * Agenda das transicoes de pedido da simulacao.
 *
 * O pagamento simulado nao resolve na resposta HTTP: o pedido nasce `pending` e
 * um temporizador o confirma ou recusa depois, emitindo `order.updated`. E o
 * que faz a confirmacao depender de verdade do tempo real (enunciado §7) em vez de
 * ser otimista no fim do checkout.
 *
 * Todo temporizador fica registrado aqui para que o reset da simulacao possa
 * cancelar tudo — sem isso um teste veria o pedido do teste anterior mudando.
 */

/** Temporizadores pendentes. */
const timers = new Set<ReturnType<typeof setTimeout>>();

/** Resolucoes possiveis de um pagamento agendado. */
type ScheduledOutcome = 'confirm' | 'decline';

/** Configuracao de uma resolucao agendada. */
interface ScheduleOptions {
  /** Atraso antes de resolver. */
  delayMs: number;
  /** Como o pagamento termina. */
  outcome: ScheduledOutcome;
  /** Cenario vigente, registrado no recibo. */
  scenario: string;
  /** Motivo da recusa, quando `outcome` e `decline`. */
  declineReason?: OrderDeclineReason;
}

/**
 * Agenda a resolucao de um pedido pendente.
 *
 * @param orderId - Pedido a resolver.
 * @param options - Atraso, desfecho, cenario e motivo da recusa.
 */
export function schedulePaymentResolution(orderId: string, options: ScheduleOptions): void {
  const timer = setTimeout(() => {
    timers.delete(timer);

    const db = getDatabase();
    const order = db.orders.find((candidate) => candidate.id === orderId);
    if (!order) return;

    transitionOrder(db, order, options.outcome === 'confirm' ? 'confirmed' : 'declined', {
      scenario: options.scenario,
      ...(options.declineReason ? { declineReason: options.declineReason } : {}),
    });
  }, options.delayMs);

  timers.add(timer);
}

/** Cancela todas as resolucoes agendadas (reset e troca de cenario). */
export function clearScheduledTasks(): void {
  for (const timer of timers) clearTimeout(timer);
  timers.clear();
}

/**
 * Quantidade de resolucoes pendentes.
 *
 * @returns Numero de temporizadores ativos.
 */
export function getScheduledTaskCount(): number {
  return timers.size;
}
