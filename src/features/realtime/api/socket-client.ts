import { io, type Socket } from 'socket.io-client';

import { ENV } from '@/constants/env';
import { SOCKET_EVENTS, SOCKET_PATH } from '@/constants/socket';
import type { ClientToServerEvents, ServerToClientEvents } from '@/features/realtime/types/events';

/** Socket tipado pelos contratos de evento do projeto. */
export type KurioSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/** Instancia unica do socket da sessao corrente. */
let socket: KurioSocket | null = null;

/** Identidade anunciada ao servidor simulado; `null` enquanto visitante. */
let identity: string | null = null;

/** Assinantes avisados quando a INSTANCIA do socket e trocada. */
const instanceListeners = new Set<() => void>();

/**
 * Cria a conexao da sessao corrente.
 *
 * A identificacao acontece no evento `connect` (e nao uma unica vez apos
 * `connect()`) para que uma reconexao volte a anunciar quem esta ouvindo — o
 * binding do MSW nao tem rooms, e e esse anuncio que faz `order.updated`
 * chegar somente as conexoes do dono.
 *
 * @returns Socket recem-criado, ainda desconectado.
 */
function createSocket(): KurioSocket {
  const next: KurioSocket = io(ENV.socketUrl, {
    path: SOCKET_PATH,
    autoConnect: false,
    transports: ['websocket'],
    withCredentials: true,
  });

  next.on('connect', () => {
    next.emit(SOCKET_EVENTS.identify, { userId: identity });
  });

  return next;
}

/**
 * Devolve o socket da sessao, criando-o na primeira chamada.
 *
 * A conexao e explicita (`autoConnect: false` + `connect()`) para garantir que
 * o worker do MSW ja esteja instalado quando o engine.io abrir o transporte —
 * caso contrario o MSW nao consegue interceptar o WebSocket.
 *
 * @returns Socket conectado (ou conectando) da sessao atual.
 */
export function getSocket(): KurioSocket {
  socket ??= createSocket();

  if (!socket.connected) socket.connect();
  return socket;
}

/**
 * Encerra a conexao e descarta a instancia.
 * Chamado no logout e na troca de usuario para que nenhum listener da sessao
 * anterior continue vivo nem toque nos dados de outro usuario.
 */
export function disposeSocket(): void {
  if (!socket) return;
  // Desconecta antes de limpar: assim os listeners ainda recebem `disconnect`
  // e quem observa o estado da conexao nao fica com um valor obsoleto.
  socket.disconnect();
  socket.removeAllListeners();
  socket = null;
}

/**
 * Assina a TROCA de instancia do socket.
 *
 * Existe porque a troca de usuario descarta a conexao inteira: quem registrou
 * listeners na instancia anterior precisa re-liga-los na nova, senao ficaria
 * ouvindo um socket morto. E o mesmo mecanismo que garante que nada da sessao
 * anterior sobreviva a troca.
 *
 * @param listener - Callback chamado apos a instancia ser descartada.
 * @returns Funcao de limpeza que remove o assinante.
 */
export function subscribeToSocketInstance(listener: () => void): () => void {
  instanceListeners.add(listener);
  return () => {
    instanceListeners.delete(listener);
  };
}

/**
 * Passa a valer outra identidade no tempo real (login, logout, troca de conta).
 *
 * Quando a identidade muda de verdade, a conexao anterior e derrubada com todos
 * os seus listeners e os assinantes reabrem uma conexao nova, que se anuncia
 * como o novo dono. Identidade igual e no-op — refetch de sessao nao pode
 * provocar reconexao desnecessaria.
 *
 * @param userId - Usuario da sessao, ou `null` para visitante.
 */
export function resetSocketSession(userId: string | null): void {
  if (identity === userId) return;

  identity = userId;
  disposeSocket();
  // Copia antes de percorrer: reabrir a conexao pode mexer na lista.
  for (const listener of new Set(instanceListeners)) listener();
}
