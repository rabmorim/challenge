import { getSocket, subscribeToSocketInstance } from '@/features/realtime/api/socket-client';
import type { SocketStatus } from '@/features/realtime/types/socket-status';

/**
 * Store externo com o estado da conexao de tempo real.
 *
 * Existe para que a interface leia o socket via `useSyncExternalStore` em vez
 * de espelhar o estado em `useState` dentro de um efeito — o socket e um
 * sistema externo, e essa e a forma que o React oferece para assina-lo sem
 * renders em cascata.
 */
let status: SocketStatus = 'connecting';

/** Assinantes React notificados a cada mudanca de estado. */
const listeners = new Set<() => void>();

/**
 * Atualiza o estado e notifica os assinantes.
 * Ignora atualizacoes redundantes para nao provocar render desnecessario.
 *
 * @param next - Novo estado da conexao.
 */
function publish(next: SocketStatus): void {
  if (status === next) return;
  status = next;
  for (const notify of listeners) notify();
}

/**
 * Liga os listeners de conexao a instancia corrente do socket.
 *
 * @returns Funcao que remove os listeners desta instancia.
 */
function attachToCurrentSocket(): () => void {
  const socket = getSocket();

  const handleConnect = () => {
    publish('connected');
  };
  const handleDisconnect = () => {
    publish('disconnected');
  };
  const handleConnectError = () => {
    publish('error');
  };

  socket.on('connect', handleConnect);
  socket.on('disconnect', handleDisconnect);
  socket.on('connect_error', handleConnectError);

  // O socket pode ja estar conectado de uma tela anterior.
  if (socket.connected) publish('connected');

  return () => {
    socket.off('connect', handleConnect);
    socket.off('disconnect', handleDisconnect);
    socket.off('connect_error', handleConnectError);
  };
}

/**
 * Assina as mudancas de estado da conexao, abrindo o socket se preciso.
 *
 * A assinatura acompanha tambem a TROCA de instancia (login/logout): quando a
 * conexao da sessao anterior e descartada, os listeners sao re-ligados na nova
 * e o estado volta a `connecting`.
 *
 * @param onChange - Callback do React a ser chamado quando o estado mudar.
 * @returns Funcao de limpeza que remove o assinante e seus listeners.
 */
export function subscribeToSocketStatus(onChange: () => void): () => void {
  listeners.add(onChange);
  let detach = attachToCurrentSocket();

  const unsubscribeInstance = subscribeToSocketInstance(() => {
    detach();
    publish('connecting');
    detach = attachToCurrentSocket();
  });

  return () => {
    listeners.delete(onChange);
    detach();
    unsubscribeInstance();
  };
}

/**
 * Le o estado atual da conexao.
 *
 * @returns Estado da conexao de tempo real.
 */
export function getSocketStatusSnapshot(): SocketStatus {
  return status;
}
