import { useState } from 'react';

import { MIN_ITEM_QUANTITY } from '@/features/cart/constants/cart';
import type { NftDetail } from '@/features/catalog/types/nft';
import type { QuantitySelection } from '@/features/nft-detail/types/detail-state';

/**
 * Quantidade escolhida no detalhe, presa ao que a edição permite.
 *
 * O teto é o menor valor entre o limite por pedido e as unidades disponíveis —
 * os dois são regra do servidor, e a interface não pode oferecer mais do que
 * existe.
 *
 * A quantidade é limitada **durante a renderização**, e não por efeito: quando
 * um `nft.updated` derruba a disponibilidade com a tela aberta, o valor exibido
 * já sai corrigido no mesmo render, sem um quadro intermediário mostrando um
 * número impossível.
 *
 * @param nft - NFT exibido.
 * @returns Quantidade corrente, teto e o setter já limitado.
 */
export function useQuantitySelection(nft: NftDetail): QuantitySelection {
  const max = Math.min(nft.edition.maxPerOrder, nft.edition.available);
  const [requested, setRequested] = useState(MIN_ITEM_QUANTITY);

  /**
   * Prende um valor entre o mínimo e o teto corrente.
   *
   * @param value - Valor pedido.
   * @returns Valor aceitável para a edição.
   */
  function clamp(value: number): number {
    return Math.max(MIN_ITEM_QUANTITY, Math.min(value, Math.max(MIN_ITEM_QUANTITY, max)));
  }

  return {
    quantity: clamp(requested),
    max,
    setQuantity: (value) => {
      setRequested(clamp(value));
    },
  };
}
