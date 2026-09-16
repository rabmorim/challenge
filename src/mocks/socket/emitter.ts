import { SOCKET_EVENTS } from '@/constants/socket';
import type { Order } from '@/features/checkout/types/order';
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/features/realtime/types/events';
import { createEventId } from '@/mocks/lib/ids';
import type { NftRecord } from '@/mocks/types/db';
import type { SocketEmitter } from '@/mocks/types/socket';

/**
 * Emissor de eventos de tempo real da simulacao.
 *
 * Fica amarrado ao store: quem muda um recurso no servidor simulado emite o
 * evento correspondente na mesma operacao. E o que garante que REST e eventos
 * nunca divirjam — e que nenhum caminho de negocio precise emitir "na mao"
 * pela interface.
 *
 * O binding do MSW nao tem rooms: o escopo por usuario e resolvido de duas
 * formas complementares. Aqui, cada conexao guarda o `userId` que anunciou
 * (evento `session.identify`) e `order.updated` so vai para conexoes daquele
 * usuario. E, como o payload tambem carrega `userId`, o cliente confere de novo
 * antes de aplicar — evento de sessao anterior nunca toca dado de outro usuario.
 */

/** Conexoes abertas, com a identidade que cada uma anunciou. */
const connections = new Map<SocketEmitter, { userId: string | null }>();

/**
 * Registra uma conexao para receber eventos.
 *
 * @param client - Conexao do cliente (lado servidor do binding).
 * @returns Funcao de limpeza que remove a conexao do conjunto.
 */
export function registerConnection(client: SocketEmitter): () => void {
  connections.set(client, { userId: null });
  return () => {
    connections.delete(client);
  };
}

/**
 * Registra a quem pertence uma conexao.
 * Chamado quando o cliente emite `session.identify` — no login, na troca de
 * usuario e na reconexao.
 *
 * @param client - Conexao ja registrada.
 * @param userId - Usuario da sessao, ou `null` para visitante.
 */
export function identifyConnection(client: SocketEmitter, userId: string | null): void {
  if (!connections.has(client)) return;
  connections.set(client, { userId });
}

/** Remove todas as conexoes — usado no reset da simulacao. */
export function clearConnections(): void {
  connections.clear();
}

/**
 * Quantidade de conexoes ativas.
 *
 * @returns Numero de clientes assinando eventos.
 */
export function getConnectionCount(): number {
  return connections.size;
}

/**
 * Envia um evento para as conexoes abertas.
 *
 * @param event - Nome do evento.
 * @param payload - Envelope do evento.
 * @param ownerId - Quando informado, so as conexoes desse usuario (e as que
 *   ainda nao se identificaram, que nao tem sessao para agir) recebem.
 */
function broadcast(
  event: string,
  payload: NftUpdatedEvent | OrderUpdatedEvent,
  ownerId?: string,
): void {
  for (const [client, meta] of connections) {
    if (ownerId && meta.userId !== null && meta.userId !== ownerId) continue;
    client.emit(event, payload);
  }
}

/**
 * Emite `nft.updated` com o estado atual do recurso.
 *
 * @param nft - Registro ja atualizado no store (a `version` precisa ter subido).
 * @returns Envelope emitido, util para os testes afirmarem sobre ele.
 */
export function emitNftUpdated(nft: NftRecord): NftUpdatedEvent {
  const event: NftUpdatedEvent = {
    eventId: createEventId(),
    resource: 'nft',
    id: nft.id,
    version: nft.version,
    occurredAt: new Date().toISOString(),
    payload: {
      price: nft.price,
      previousPrice: nft.previousPrice,
      available: nft.edition.available,
    },
  };

  broadcast(SOCKET_EVENTS.nftUpdated, event);
  return event;
}

/**
 * Emite um `nft.updated` deliberadamente FORA DE ORDEM.
 *
 * Nada muda no servidor: o envelope carrega uma versao escolhida (menor ou
 * igual a atual) e valores que nao estao no store. Existe para um unico fim —
 * o cliente precisa provar que descarta evento antigo ou reentregue sem
 * regredir o estado mais novo (enunciado §7). Fora dos testes, nenhum caminho
 * chama esta funcao.
 *
 * @param nft - NFT afetado, no estado atual.
 * @param version - Versao a declarar no envelope.
 * @param payload - Valores do envelope; o que faltar vem do estado atual.
 * @returns Envelope emitido.
 */
export function emitStaleNftUpdated(
  nft: NftRecord,
  version: number,
  payload: Partial<NftUpdatedEvent['payload']> = {},
): NftUpdatedEvent {
  const event: NftUpdatedEvent = {
    eventId: createEventId(),
    resource: 'nft',
    id: nft.id,
    version,
    occurredAt: new Date().toISOString(),
    payload: {
      price: payload.price ?? nft.price,
      previousPrice: payload.previousPrice ?? nft.previousPrice,
      available: payload.available ?? nft.edition.available,
    },
  };

  broadcast(SOCKET_EVENTS.nftUpdated, event);
  return event;
}

/**
 * Emite `order.updated` com o estado atual do pedido.
 *
 * @param order - Pedido ja atualizado no store.
 * @returns Envelope emitido.
 */
export function emitOrderUpdated(order: Order): OrderUpdatedEvent {
  const event: OrderUpdatedEvent = {
    eventId: createEventId(),
    resource: 'order',
    id: order.id,
    version: order.version,
    occurredAt: new Date().toISOString(),
    payload: {
      status: order.status,
      userId: order.userId,
      transactionHash: order.transactionHash,
      declineReason: order.declineReason,
    },
  };

  broadcast(SOCKET_EVENTS.orderUpdated, event, order.userId);
  return event;
}
