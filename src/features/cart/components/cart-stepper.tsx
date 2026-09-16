import { MinusIcon, PlusIcon } from 'lucide-react';
import { useId } from 'react';

import { CART_COPY } from '@/features/cart/constants/cart-copy';
import { MIN_ITEM_QUANTITY } from '@/features/cart/constants/cart';
import { maxCartQuantity } from '@/features/cart/lib/cart-quantity';
import type { CartStepperProps } from '@/features/cart/types/cart-components';
import { cn } from '@/lib/utils';

/**
 * Seletor de quantidade de uma linha do carrinho.
 *
 * O número é um `input type="number"` de verdade, e não um texto entre dois
 * botões: assim ele é alcançável por Tab, aceita digitação e setas do teclado, e
 * o leitor de tela lê rótulo, valor e limites. O rótulo nomeia o NFT — numa
 * tabela com várias linhas, "Quantidade" sozinho não diz de qual item.
 *
 * O teto vem da edição na resposta mais recente, então um `nft.updated` que
 * derruba a disponibilidade desabilita o "+" no mesmo quadro.
 *
 * As cápsulas accent de 17×26 são as do frame de 1440; a `compact` são os
 * círculos de 24px do frame de 414. A variante compacta é medida para caber em
 * 80px no total, que é o que sobra ao lado do texto num aparelho de 390.
 *
 * @param props - Linha, estado da mutation, callback e variante visual.
 */
export function CartStepper({ item, isBusy, onChange, variant = 'default' }: CartStepperProps) {
  const inputId = useId();
  const max = maxCartQuantity(item.edition);
  const isCompact = variant === 'compact';

  const buttonClassName = cn(
    'flex shrink-0 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-40',
    isCompact
      ? 'border-primary text-primary size-6 rounded-full border'
      : 'bg-primary text-primary-foreground h-[26px] w-[17px] rounded-full',
  );

  return (
    <div className={cn('flex items-center', isCompact ? 'gap-1' : 'gap-2')}>
      <label className="sr-only" htmlFor={inputId}>
        {CART_COPY.quantityLabel(item.name)}
      </label>

      <button
        type="button"
        aria-label={CART_COPY.decrease(item.name)}
        disabled={isBusy || item.quantity <= MIN_ITEM_QUANTITY}
        onClick={() => {
          onChange(item.quantity - 1);
        }}
        className={buttonClassName}
      >
        <MinusIcon className={isCompact ? 'size-3.5' : 'size-3'} aria-hidden="true" />
      </button>

      <input
        id={inputId}
        type="number"
        inputMode="numeric"
        min={MIN_ITEM_QUANTITY}
        max={max}
        value={item.quantity}
        disabled={isBusy}
        data-testid="cart-quantity"
        onChange={(event) => {
          const next = Number.parseInt(event.target.value, 10);
          if (Number.isInteger(next)) onChange(next);
        }}
        className={cn(
          'bg-transparent text-center outline-none [appearance:textfield] disabled:opacity-60 [&::-webkit-inner-spin-button]:appearance-none',
          isCompact ? 'w-6 text-[15px]' : 'text-body-lg w-8',
        )}
      />

      <button
        type="button"
        aria-label={CART_COPY.increase(item.name)}
        disabled={isBusy || item.quantity >= max}
        onClick={() => {
          onChange(item.quantity + 1);
        }}
        className={buttonClassName}
      >
        <PlusIcon className={isCompact ? 'size-3.5' : 'size-3'} aria-hidden="true" />
      </button>
    </div>
  );
}
