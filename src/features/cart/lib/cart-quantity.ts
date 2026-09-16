import { MIN_ITEM_QUANTITY } from '@/features/cart/constants/cart';
import type { NftEdition } from '@/features/catalog/types/nft';
import type { Quantity } from '@/types/api';

/**
 * Regras de quantidade de uma linha do carrinho.
 *
 * As mesmas duas restricoes que o servidor aplica no `POST /cart/items` e no
 * `PATCH /cart/items/:id` — limite por pedido e unidades disponiveis. Aqui elas
 * existem para o controle nao oferecer o que seria recusado: o teto desabilita
 * o "+", e um valor digitado acima dele e aparado antes de virar requisicao.
 * O servidor continua sendo quem decide; isto so evita o erro previsivel.
 */

/**
 * Teto de unidades de uma linha, agora.
 *
 * @param edition - Estado da edicao na resposta mais recente.
 * @returns Maior quantidade aceitavel; `0` quando a edicao esgotou.
 */
export function maxCartQuantity(edition: NftEdition): Quantity {
  return Math.min(edition.maxPerOrder, edition.available);
}

/**
 * Apara uma quantidade pretendida para dentro do teto da edicao.
 *
 * @param quantity - Valor pretendido (digitado ou calculado pelo stepper).
 * @param edition - Estado da edicao na resposta mais recente.
 * @returns Quantidade inteira entre o minimo e o teto da edicao.
 */
export function clampCartQuantity(quantity: Quantity, edition: NftEdition): Quantity {
  const ceiling = maxCartQuantity(edition);
  if (ceiling < MIN_ITEM_QUANTITY) return MIN_ITEM_QUANTITY;

  return Math.min(Math.max(Math.trunc(quantity), MIN_ITEM_QUANTITY), ceiling);
}
