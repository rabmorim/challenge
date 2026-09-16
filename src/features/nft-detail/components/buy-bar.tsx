import { ShoppingCartIcon } from 'lucide-react';
import { useId } from 'react';

import { ADD_TO_CART_COPY } from '@/features/cart/constants/cart-copy';
import { BuyNote } from '@/features/nft-detail/components/buy-note';
import { QuantityStepper } from '@/features/nft-detail/components/quantity-stepper';
import { useBuyIntent } from '@/features/nft-detail/hooks/use-buy-intent';
import { useQuantitySelection } from '@/features/nft-detail/hooks/use-quantity-selection';
import type { BuyBarProps } from '@/features/nft-detail/types/detail-components';
import { formatEth } from '@/lib/eth';

/**
 * Barra fixa de compra do frame de 414.
 *
 * Reúne o que o celular precisa ter sempre à mão — quantidade, preço, comprar e
 * adicionar ao carrinho —, com o vão inferior respeitando a área segura do
 * aparelho. Nesta tela ela substitui a barra de atalhos (`MobileNav`), que o
 * frame não desenha; quem esconde a outra é o layout raiz, para as duas nunca
 * disputarem o mesmo lugar.
 *
 * A fixação é `sticky`, e não `fixed`: assim a barra ocupa o próprio lugar no
 * fim da página — flutua sobre o conteúdo enquanto há o que rolar e cede a vez
 * ao rodapé quando ele chega — sem precisar de um vão fantasma reservado para
 * ela embaixo do conteúdo.
 *
 * O preço e o teto de quantidade vêm do recurso, que o `nft.updated` mantém
 * atualizado com a tela aberta: a barra acompanha sem estado próprio.
 *
 * @param props - NFT exibido.
 */
export function BuyBar({ nft }: BuyBarProps) {
  const { quantity, max, setQuantity } = useQuantitySelection(nft);
  const intent = useBuyIntent(nft, quantity);
  const noteId = useId();

  return (
    <div
      data-testid="buy-bar"
      className="buy-bar-surface sticky bottom-0 z-30 flex flex-col gap-5 rounded-t-[40px] px-6 pt-5 pb-[calc(36px+env(safe-area-inset-bottom))]"
    >
      <div className="flex items-center justify-between gap-3">
        <QuantityStepper value={quantity} max={max} onChange={setQuantity} variant="compact" />

        <p className="text-primary text-[20px] leading-4 font-bold" data-testid="detail-price">
          {formatEth(nft.price)}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          data-testid="buy-button"
          aria-describedby={noteId}
          disabled={intent.isDisabled}
          onClick={intent.trigger}
          className="bg-primary text-primary-foreground flex h-[60px] w-[196px] shrink-0 cursor-pointer items-center justify-center rounded-[40px] text-[16px] leading-4 font-bold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {ADD_TO_CART_COPY.buyDetail}
        </button>

        <button
          type="button"
          data-testid="add-to-cart-button"
          aria-label={ADD_TO_CART_COPY.addToCart}
          aria-describedby={noteId}
          disabled={intent.isDisabled}
          onClick={intent.trigger}
          className="border-border bg-surface-lift text-icon-muted flex size-[60px] shrink-0 cursor-pointer items-center justify-center rounded-[40px] border disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingCartIcon className="size-[18px]" aria-hidden="true" />
        </button>
      </div>

      <BuyNote id={noteId} nft={nft} quantity={quantity} />
    </div>
  );
}
