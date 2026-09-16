import type { NftUpdatedEvent } from '@/features/realtime/types/events';
import { commitDatabase } from '@/mocks/db/store';
import { emitNftUpdated } from '@/mocks/socket/emitter';
import type { NftRecord } from '@/mocks/types/db';
import type { EthAmount, Quantity } from '@/types/api';

/**
 * Mutacoes de mercado de um NFT (preco e disponibilidade).
 *
 * Todas passam por aqui de proposito: a funcao sobe a `version`, persiste e
 * emite `nft.updated` na mesma operacao — nao existe caminho que mude o preco
 * sem avisar quem esta ouvindo, nem evento sem mudanca real no store.
 */

/** Mudancas aceitas em uma alteracao de mercado. */
interface NftMarketChanges {
  /** Novo preco; o preco antigo passa a ser `previousPrice`. */
  price?: EthAmount;
  /** Nova quantidade disponivel (nunca negativa). */
  available?: Quantity;
}

/**
 * Aplica uma alteracao de preco/disponibilidade.
 *
 * @param nft - Registro do store a alterar (mutado no lugar).
 * @param changes - Preco e/ou disponibilidade novos.
 * @returns Evento `nft.updated` efetivamente emitido.
 */
export function updateNftMarket(nft: NftRecord, changes: NftMarketChanges): NftUpdatedEvent {
  if (changes.price !== undefined && changes.price !== nft.price) {
    nft.previousPrice = nft.price;
    nft.price = changes.price;
  }

  if (changes.available !== undefined) {
    nft.edition.available = Math.max(0, Math.trunc(changes.available));
  }

  nft.version += 1;
  commitDatabase();

  return emitNftUpdated(nft);
}

/**
 * Reserva unidades de uma edicao (compra confirmada ou pedido criado).
 *
 * @param nft - Registro do store.
 * @param quantity - Unidades a retirar da disponibilidade.
 * @returns Evento emitido com a nova disponibilidade.
 */
export function reserveEditionUnits(nft: NftRecord, quantity: Quantity): NftUpdatedEvent {
  return updateNftMarket(nft, { available: nft.edition.available - quantity });
}

/**
 * Devolve unidades a edicao (pedido recusado).
 *
 * @param nft - Registro do store.
 * @param quantity - Unidades a devolver.
 * @returns Evento emitido com a nova disponibilidade.
 */
export function releaseEditionUnits(nft: NftRecord, quantity: Quantity): NftUpdatedEvent {
  return updateNftMarket(nft, {
    available: Math.min(nft.edition.total, nft.edition.available + quantity),
  });
}
