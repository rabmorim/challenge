import { useEffect } from 'react';

import { getSocket, subscribeToSocketInstance } from '@/features/realtime/api/socket-client';
import type { KurioSocket } from '@/features/realtime/api/socket-client';
import type { ServerToClientEvents } from '@/features/realtime/types/events';
import type { SocketEventBinder } from '@/features/realtime/types/socket-status';

/**
 * Visão mínima do socket usada para registrar o listener.
 *
 * O `socket.io-client` resolve o tipo do tratador por condicional sobre o nome
 * do evento; com o nome ainda genérico (o hook aceita qualquer evento do
 * contrato) o compilador não consegue reduzir essa condicional. O contrato
 * continua garantido na assinatura pública do hook — esta redução vale só aqui
 * dentro, para ligar e desligar o mesmo par (evento, tratador).
 *
 * @param socket - Socket da sessão corrente.
 * @returns O mesmo socket na forma de binder genérico.
 */
function asBinder(socket: KurioSocket): SocketEventBinder {
  return socket as unknown as SocketEventBinder;
}

/**
 * Assina um evento do servidor no socket da sessão corrente.
 *
 * Duas responsabilidades que o `socket.on` cru não cobre:
 *
 * 1. **Limpeza**: o listener sai no desmonte — nada da tela anterior continua
 *    ouvindo (regra do enunciado §7).
 * 2. **Troca de identidade**: login, logout e troca de usuário descartam a
 *    conexão inteira; sem re-assinar, o listener ficaria preso a um socket
 *    morto. `subscribeToSocketInstance` avisa a substituição e o efeito religa.
 *
 * @param event - Nome do evento (chave de `SOCKET_EVENTS`).
 * @param handler - Tratador, já tipado pelo contrato do evento.
 */
export function useSocketEvent<TEvent extends keyof ServerToClientEvents>(
  event: TEvent,
  handler: ServerToClientEvents[TEvent],
): void {
  useEffect(() => {
    let binder = asBinder(getSocket());
    const listener = handler as (...args: unknown[]) => void;

    binder.on(event, listener);

    const unsubscribe = subscribeToSocketInstance(() => {
      binder.off(event, listener);
      binder = asBinder(getSocket());
      binder.on(event, listener);
    });

    return () => {
      binder.off(event, listener);
      unsubscribe();
    };
  }, [event, handler]);
}
