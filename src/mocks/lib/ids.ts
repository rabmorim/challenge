import { nextSequence } from '@/mocks/db/store';
import { ORDER_REFERENCE_PREFIX } from '@/mocks/constants';
import { SEQUENCE_NAMES } from '@/mocks/fixtures';
import { stableHash } from '@/mocks/lib/hash';

/**
 * Geradores de identificadores da simulacao.
 *
 * Sao sequenciais (e nao aleatorios) de proposito: com ids previsiveis os
 * testes conseguem afirmar sobre o recurso criado sem ler a resposta inteira,
 * e o estado persistido continua legivel na inspecao do navegador.
 */

/** Quantidade de digitos da referencia legivel de pedido. */
const REFERENCE_DIGITS = 6;

/** Comprimento de um hash de transacao simulado (32 bytes em hexadecimal). */
const TRANSACTION_HASH_LENGTH = 64;

/**
 * Cria um token de sessao.
 *
 * @returns Token opaco unico.
 */
export function createSessionToken(): string {
  return `session-${String(nextSequence(SEQUENCE_NAMES.session))}`;
}

/**
 * Cria o id de um item de carrinho.
 *
 * @returns Id unico do item.
 */
export function createCartItemId(): string {
  return `cart-item-${String(nextSequence(SEQUENCE_NAMES.cartItem))}`;
}

/**
 * Cria o id de uma cotacao.
 *
 * @returns Id unico da cotacao.
 */
export function createQuoteId(): string {
  return `quote-${String(nextSequence(SEQUENCE_NAMES.quote))}`;
}

/**
 * Cria id e referencia de um pedido no mesmo passo, para que os dois nunca
 * saiam de sincronia.
 *
 * @returns Id interno e referencia exibida na confirmacao.
 */
export function createOrderIdentity(): { id: string; reference: string } {
  const sequence = nextSequence(SEQUENCE_NAMES.order);
  return {
    id: `order-${String(sequence)}`,
    reference: `${ORDER_REFERENCE_PREFIX}-${String(sequence).padStart(REFERENCE_DIGITS, '0')}`,
  };
}

/**
 * Cria o id de uma carteira.
 *
 * @returns Id unico da carteira.
 */
export function createWalletId(): string {
  return `wallet-${String(nextSequence(SEQUENCE_NAMES.wallet))}`;
}

/**
 * Cria o id de um usuario cadastrado pela interface.
 *
 * @returns Id unico do usuario.
 */
export function createUserId(): string {
  return `user-${String(nextSequence(SEQUENCE_NAMES.user))}`;
}

/**
 * Cria o id de uma entrega de evento de tempo real.
 * E o que permite ao cliente ignorar reentregas do mesmo evento.
 *
 * @returns Id unico da entrega.
 */
export function createEventId(): string {
  return `event-${String(nextSequence(SEQUENCE_NAMES.event))}`;
}

/**
 * Deriva um hash de transacao simulado a partir do id do pedido.
 * Determinístico: o mesmo pedido sempre exibe o mesmo hash no recibo.
 *
 * @param orderId - Id do pedido confirmado.
 * @returns Hash hexadecimal com prefixo `0x`.
 */
export function createTransactionHash(orderId: string): string {
  let digest = '';
  let round = 0;

  while (digest.length < TRANSACTION_HASH_LENGTH) {
    digest += stableHash(`${orderId}:${String(round)}`);
    round += 1;
  }

  return `0x${digest.slice(0, TRANSACTION_HASH_LENGTH)}`;
}
