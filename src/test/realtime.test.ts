import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { SOCKET_EVENTS } from '@/constants/socket';
import { login } from '@/features/auth/api/auth-api';
import { fetchNft } from '@/features/catalog/api/nfts-api';
import { createIdempotencyKey, createOrder } from '@/features/checkout/api/orders-api';
import { createQuote } from '@/features/checkout/api/quotes-api';
import {
  disposeSocket,
  getSocket,
  type KurioSocket,
} from '@/features/realtime/api/socket-client';
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/features/realtime/types/events';
import { emitNftEvent, emitOrderEvent, selectScenario } from '@/test/mock-control';

/**
 * Tempo real: os eventos chegam pelo `socket.io-client` de verdade, passando
 * pelo binding Socket.IO do MSW — nada de setter direto no cache.
 *
 * Confere tambem a consistencia entre REST e eventos: a versao que vem no
 * evento e a mesma que o REST devolve depois.
 */

/** Espera maxima por um evento antes de considerar falha. */
const EVENT_TIMEOUT_MS = 4_000;

/** Socket da suite; aberto uma vez, descartado no fim (sem listener orfao). */
let socket: KurioSocket;

/**
 * Arma o prazo maximo de espera de um evento.
 *
 * @param event - Nome do evento aguardado (aparece na mensagem de falha).
 * @param reject - Rejeicao da promessa que espera o evento.
 * @returns Temporizador a cancelar quando o evento chegar.
 */
function failAfterTimeout(event: string, reject: (error: Error) => void): ReturnType<typeof setTimeout> {
  return setTimeout(() => {
    reject(new Error(`Evento "${event}" nao chegou em ${String(EVENT_TIMEOUT_MS)}ms.`));
  }, EVENT_TIMEOUT_MS);
}

/**
 * Aguarda a proxima entrega de `nft.updated`.
 *
 * @returns Envelope recebido pelo `socket.io-client`.
 * @throws {Error} Quando nada chega dentro do prazo.
 */
function nextNftEvent(): Promise<NftUpdatedEvent> {
  return new Promise<NftUpdatedEvent>((resolve, reject) => {
    const timer = failAfterTimeout(SOCKET_EVENTS.nftUpdated, reject);

    socket.once(SOCKET_EVENTS.nftUpdated, (event) => {
      clearTimeout(timer);
      resolve(event);
    });
  });
}

/**
 * Aguarda a proxima entrega de `order.updated`.
 *
 * @returns Envelope recebido pelo `socket.io-client`.
 * @throws {Error} Quando nada chega dentro do prazo.
 */
function nextOrderEvent(): Promise<OrderUpdatedEvent> {
  return new Promise<OrderUpdatedEvent>((resolve, reject) => {
    const timer = failAfterTimeout(SOCKET_EVENTS.orderUpdated, reject);

    socket.once(SOCKET_EVENTS.orderUpdated, (event) => {
      clearTimeout(timer);
      resolve(event);
    });
  });
}

beforeAll(async () => {
  socket = getSocket();

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('O socket nao conectou pelo binding do MSW.'));
    }, EVENT_TIMEOUT_MS);

    socket.on('connect', () => {
      clearTimeout(timer);
      resolve();
    });
    socket.on('connect_error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
});

afterAll(() => {
  // Libera listeners e conexao ao fim do ciclo de vida.
  disposeSocket();
});

describe('tempo real', () => {
  it('conecta pelo socket.io-client', () => {
    expect(socket.connected).toBe(true);
  });

  it('entrega nft.updated com id estavel e versao, coerente com o REST', async () => {
    const received = nextNftEvent();
    await emitNftEvent({ nftId: 'emerald-ape-042', price: '1.49', available: 9 });

    const event = await received;

    expect(event).toMatchObject({
      resource: 'nft',
      id: 'emerald-ape-042',
      version: 2,
      payload: { price: '1.49', previousPrice: '1.19', available: 9 },
    });
    expect(event.eventId).toMatch(/^event-\d+$/);

    const nft = await fetchNft('emerald-ape-042');
    expect(nft.price).toBe(event.payload.price);
    expect(nft.version).toBe(event.version);
  });

  it('reentrega o mesmo evento sem mudar a versao do recurso', async () => {
    const first = nextNftEvent();
    await emitNftEvent({ nftId: 'golden-beat-207', price: '1.05' });
    const changed = await first;

    // Reemissao sem mudanca: duplicata que o cliente precisa tolerar.
    const duplicate = nextNftEvent();
    await emitNftEvent({ nftId: 'golden-beat-207' });
    const replayed = await duplicate;

    expect(replayed.version).toBe(changed.version);
    expect(replayed.eventId).not.toBe(changed.eventId);
  });

  it('entrega order.updated do proprio usuario quando o pedido e resolvido', async () => {
    await selectScenario('payment-manual');
    const { user } = await login({ email: 'ana@kurio.dev', password: 'kurio1234' });

    // A conexao anuncia a sessao; o servidor simulado nao manda evento de
    // pedido para conexao de outro usuario.
    socket.emit(SOCKET_EVENTS.identify, { userId: user.id });

    const quote = await createQuote({
      items: [{ nftId: 'emerald-ape-042', quantity: 1 }],
      network: 'ethereum',
    });

    const order = await createOrder(
      {
        quoteId: quote.id,
        pricingSignature: quote.pricingSignature,
        items: quote.lines.map((line) => ({ nftId: line.nftId, quantity: line.quantity })),
        couponCode: null,
        network: quote.network,
        walletId: 'wallet-ana-primary',
        collector: {
          displayName: 'Ana Ribeiro',
          username: 'ana.colecionadora',
          profileName: 'Acervo Ribeiro',
          email: 'ana@kurio.dev',
          walletAddress: '0xA91F7c3b0d5e2481a6f09c4b7d3e150f9a26E82C',
          secondaryWallet: null,
          referralCode: 'KURIO-ANA',
          ensDomain: '.eth',
          usesAlternateWallet: false,
          note: null,
        },
      },
      createIdempotencyKey(),
    );

    expect(order.status).toBe('pending');

    const received = nextOrderEvent();
    await emitOrderEvent({ orderId: order.id, status: 'confirmed' });
    const event = await received;

    expect(event).toMatchObject({
      resource: 'order',
      id: order.id,
      payload: { status: 'confirmed', userId: user.id },
    });
    expect(event.version).toBeGreaterThan(order.version);
    expect(event.payload.transactionHash).toMatch(/^0x[0-9a-f]{64}$/);
  });
});
