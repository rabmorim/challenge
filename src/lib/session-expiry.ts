import type {
  SessionExpiryEvent,
  SessionExpiryListener,
} from '@/types/session-expiry';

/**
 * Aviso de sessao invalidada, emitido pelo interceptor do Axios.
 *
 * E um pub/sub minusculo, sem React e sem router, de proposito: o interceptor
 * vive na camada de transporte e nao pode importar cache nem navegacao sem
 * inverter as dependencias. Quem reage ao aviso e um hook montado na raiz do
 * app (limpar cache privado, derrubar o socket, redirecionar preservando o
 * destino) — aqui so existe a notificacao.
 */

/** Assinantes ativos. */
const listeners = new Set<SessionExpiryListener>();

/**
 * Assina o aviso de sessao invalidada.
 *
 * @param listener - Callback chamado a cada 401 de sessao.
 * @returns Funcao de limpeza que remove o assinante.
 */
export function subscribeToSessionExpiry(listener: SessionExpiryListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Avisa que a sessao corrente deixou de valer.
 *
 * @param event - Motivo da invalidacao.
 */
export function notifySessionExpired(event: SessionExpiryEvent): void {
  // Copia antes de percorrer: um assinante pode se remover ao ser chamado.
  for (const listener of new Set(listeners)) listener(event);
}
