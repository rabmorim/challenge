import { useSyncExternalStore } from 'react';

import {
  getSocketStatusSnapshot,
  subscribeToSocketStatus,
} from '@/features/realtime/api/socket-status-store';
import type { SocketStatus } from '@/features/realtime/types/socket-status';

/**
 * Acompanha o estado da conexao Socket.IO da sessao.
 *
 * Usa `useSyncExternalStore` porque o socket e um sistema externo: assim o
 * componente le sempre o estado corrente, sem espelhar em `useState` nem
 * disparar render em cascata. Os listeners sao removidos na desmontagem e
 * re-ligados sozinhos quando a sessao troca de conexao (ver
 * `resetSocketSession`).
 *
 * @returns Estado atual da conexao de tempo real.
 */
export function useSocketStatus(): SocketStatus {
  return useSyncExternalStore(subscribeToSocketStatus, getSocketStatusSnapshot);
}
