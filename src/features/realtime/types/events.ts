import type { SOCKET_EVENTS } from '@/constants/socket';
import type { OrderDeclineReason, OrderStatus } from '@/features/checkout/types/order';
import type { EthAmount, IsoDateTime, Quantity } from '@/types/api';

/** Recursos que podem ser afetados por um evento de tempo real. */
export type RealtimeResource = 'nft' | 'order';

/**
 * Envelope comum a todos os eventos.
 *
 * Carrega identidade estavel (`id` do recurso), o recurso afetado e a `version`
 * — os tres itens que o README exige para tolerar duplicatas e eventos antigos
 * sem regredir um estado mais novo. `eventId` identifica a entrega em si, o que
 * permite ignorar reentregas do mesmo evento.
 */
export interface RealtimeEvent<TResource extends RealtimeResource, TPayload> {
  /** Id da entrega — unico por emissao. */
  eventId: string;
  resource: TResource;
  /** Id estavel do recurso afetado. */
  id: string;
  /** Versao do recurso apos a mudanca. */
  version: number;
  occurredAt: IsoDateTime;
  payload: TPayload;
}

/** Mudanca de preco/disponibilidade de um NFT. */
export interface NftUpdatedPayload {
  price: EthAmount;
  previousPrice: EthAmount | null;
  /** Unidades ainda disponiveis na edicao. */
  available: Quantity;
}

/** Mudanca de estado de um pedido. */
export interface OrderUpdatedPayload {
  status: OrderStatus;
  /** Dono do pedido — impede aplicar evento de uma sessao anterior. */
  userId: string;
  transactionHash: string | null;
  declineReason: OrderDeclineReason | null;
}

/** Evento `nft.updated`. */
export type NftUpdatedEvent = RealtimeEvent<'nft', NftUpdatedPayload>;

/** Evento `order.updated`. */
export type OrderUpdatedEvent = RealtimeEvent<'order', OrderUpdatedPayload>;

/**
 * Eventos recebidos do servidor. Usado para tipar `socket.on(...)` ponta a ponta;
 * as chaves vem de `SOCKET_EVENTS` para nao duplicar o nome dos eventos.
 */
export type ServerToClientEvents = {
  [SOCKET_EVENTS.nftUpdated]: (event: NftUpdatedEvent) => void;
  [SOCKET_EVENTS.orderUpdated]: (event: OrderUpdatedEvent) => void;
};

/**
 * Eventos emitidos pelo cliente.
 *
 * O cliente identifica a sessao logo apos conectar para que o servidor
 * simulado saiba a quem pertencem os eventos de pedido — o binding do MSW nao
 * tem rooms, entao o escopo viaja no payload e e conferido no cliente.
 */
export type ClientToServerEvents = {
  [SOCKET_EVENTS.identify]: (payload: { userId: string | null }) => void;
};
