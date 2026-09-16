import { toSocketIo } from '@mswjs/socket.io-binding';
import { ws, type WebSocketHandler } from 'msw';

import { ENV } from '@/constants/env';
import { SOCKET_EVENTS } from '@/constants/socket';
import { WS_PROTOCOL_BY_PAGE_PROTOCOL } from '@/mocks/constants';
import { identifyConnection, registerConnection } from '@/mocks/socket/emitter';

/**
 * Monta a URL do link do MSW a partir da origem configurada para o socket.
 *
 * Detalhe do MSW: antes de casar o handler ele remove o prefixo `/socket.io/`
 * do caminho da conexao. Por isso o link aponta para a ORIGEM, sem o caminho
 * do transporte — incluir `/socket.io/` aqui faria o handler nunca casar.
 *
 * @returns Origem absoluta com esquema `ws:` ou `wss:`.
 */
function buildSocketLinkUrl(): string {
  const base =
    ENV.socketUrl && ENV.socketUrl !== '/' ? ENV.socketUrl : globalThis.location.origin;
  const url = new URL(base);
  url.protocol =
    WS_PROTOCOL_BY_PAGE_PROTOCOL[url.protocol as keyof typeof WS_PROTOCOL_BY_PAGE_PROTOCOL] ??
    url.protocol;
  return url.origin;
}

/** Link do transporte WebSocket usado pelo engine.io do `socket.io-client`. */
const socketLink = ws.link(buildSocketLinkUrl());

/** Corpo esperado do evento de identificacao emitido pelo cliente. */
interface IdentifyPayload {
  userId: string | null;
}

/**
 * Handlers de Socket.IO da simulacao.
 *
 * O binding e experimental: opera somente no namespace raiz e nao implementa
 * rooms nem broadcast seletivo. Cada conexao e registrada no emissor, que e
 * quem publica `nft.updated` e `order.updated` sempre que o store muda — REST e
 * eventos partem do mesmo estado, nunca de caminhos separados.
 *
 * Ao fechar a conexao o registro e desfeito (sem listener orfao, sem evento
 * chegando para uma sessao que ja acabou).
 */
export const socketHandlers: WebSocketHandler[] = [
  socketLink.addEventListener('connection', (connection) => {
    // Converte o WebSocket cru no protocolo do Socket.IO (handshake + frames).
    const io = toSocketIo(connection);
    const unregister = registerConnection(io.client);

    io.client.on(SOCKET_EVENTS.identify, (_event, payload: IdentifyPayload | undefined) => {
      identifyConnection(io.client, payload?.userId ?? null);
    });

    connection.client.addEventListener('close', unregister);
  }),
];
