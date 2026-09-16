import { MinusIcon, PlusIcon } from 'lucide-react';
import { useId } from 'react';

import { MIN_ITEM_QUANTITY } from '@/features/cart/constants/cart';
import { DETAIL_COPY } from '@/features/nft-detail/constants/detail';
import type { QuantityStepperProps } from '@/features/nft-detail/types/detail-components';
import { cn } from '@/lib/utils';

/**
 * Seletor de quantidade.
 *
 * O teto vem do menor valor entre o limite por pedido e as unidades ainda
 * disponíveis — quem calcula isso é quem monta o componente; aqui o `max`
 * desabilita o botão, limita o campo e é anunciado junto do valor. Com a edição
 * esgotada (`max` zero) os dois botões ficam desabilitados.
 *
 * O número é um `input type="number"` de verdade, e não um texto entre dois
 * botões: assim ele é alcançável por Tab, aceita digitação e setas do teclado, e
 * o leitor de tela lê rótulo, valor e limites.
 *
 * Os botões são as cápsulas do frame (33×49,5 no accent) na variante padrão; a
 * `compact` é a barra fixa do frame de 414, onde as cápsulas medem 20×30 e
 * ganham um anel escuro contra o fundo da barra.
 *
 * @param props - Valor, teto, callback e variante visual.
 */
export function QuantityStepper({
  value,
  max,
  onChange,
  variant = 'default',
}: QuantityStepperProps) {
  const inputId = useId();
  const canDecrease = value > MIN_ITEM_QUANTITY;
  const canIncrease = value < max;
  const isCompact = variant === 'compact';

  const buttonClassName = cn(
    'bg-primary text-primary-foreground flex shrink-0 cursor-pointer items-center justify-center border disabled:cursor-not-allowed disabled:opacity-50',
    isCompact
      ? 'border-background h-[30px] w-[20px] rounded-[20px]'
      : 'border-primary h-[49.5px] w-[33px] rounded-[33px]',
  );

  const iconClassName = isCompact ? 'size-2.5' : 'size-[26.4px]';

  return (
    <div className={cn('flex items-center', isCompact ? 'gap-2' : 'gap-3')}>
      {/* O frame desktop não escreve "Quantidade" ao lado do seletor, mas o
          campo continua precisando de rótulo para o leitor de tela. */}
      <label
        className={cn(
          'text-tan',
          isCompact ? 'text-[15px] leading-4 font-medium' : 'text-body sr-only',
        )}
        htmlFor={inputId}
      >
        {isCompact ? DETAIL_COPY.quantityShort : DETAIL_COPY.quantityLabel}
      </label>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={DETAIL_COPY.decrease}
          disabled={!canDecrease}
          onClick={() => {
            onChange(value - 1);
          }}
          className={buttonClassName}
        >
          <MinusIcon className={iconClassName} aria-hidden="true" />
        </button>

        <input
          id={inputId}
          type="number"
          inputMode="numeric"
          min={MIN_ITEM_QUANTITY}
          max={max}
          value={value}
          data-testid="quantity-value"
          onChange={(event) => {
            const next = Number.parseInt(event.target.value, 10);
            if (Number.isInteger(next)) onChange(next);
          }}
          className={cn(
            'bg-transparent text-center outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none',
            isCompact ? 'text-tan w-5 text-[15px] leading-4 font-medium' : 'text-body-lg w-10',
          )}
        />

        <button
          type="button"
          aria-label={DETAIL_COPY.increase}
          disabled={!canIncrease}
          onClick={() => {
            onChange(value + 1);
          }}
          className={buttonClassName}
        >
          <PlusIcon className={iconClassName} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
