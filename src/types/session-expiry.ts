/** Tipos do aviso de sessao invalidada (`src/lib/session-expiry.ts`). */

/**
 * Motivo pelo qual a sessao deixou de valer.
 * A interface usa o motivo para escolher a mensagem: vencida por tempo e
 * diferente de revogada/desconhecida.
 */
export type SessionExpiryReason = 'SESSION_EXPIRED' | 'SESSION_INVALID';

/** Aviso entregue aos assinantes quando uma requisicao encontra 401. */
export interface SessionExpiryEvent {
  reason: SessionExpiryReason;
}

/** Assinante do aviso de sessao invalidada. */
export type SessionExpiryListener = (event: SessionExpiryEvent) => void;
