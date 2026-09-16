import { ChevronDownIcon } from 'lucide-react';

import type { CheckoutSelectProps } from '@/features/checkout/types/checkout-components';
import { cn } from '@/lib/utils';

/**
 * Seletor do formulário de pagamento ("Rede", "Tipo de carteira", "Nome ENS").
 *
 * É um `<select>` nativo por decisão, e não um menu do Radix: o controle nativo
 * já vem com navegação por teclado, busca por digitação, rolagem e o seletor do
 * sistema no celular — comportamento que uma reimplementação só teria como
 * aproximação. A seta é decorativa (`aria-hidden`) e fica sobre o campo com
 * `pointer-events-none`, para o clique continuar chegando ao controle.
 *
 * A opção vazia carrega o texto do placeholder do frame e é `disabled`: ela
 * mostra "Selecione uma rede" enquanto nada foi escolhido, mas não pode ser
 * escolhida de volta — o campo é obrigatório.
 *
 * @param props - Id, valor, opções, placeholder e a associação de erro.
 */
export function CheckoutSelect({
  id,
  value,
  options,
  placeholder,
  disabled = false,
  onChange,
  ...field
}: CheckoutSelectProps) {
  return (
    <div className="relative">
      <select
        id={id}
        name={id}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className={cn(
          'text-body rounded-control border-input w-full appearance-none border bg-transparent px-4 py-3 pr-10 leading-none outline-none',
          'focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-60',
          'aria-invalid:border-destructive',
          value === '' ? 'text-tan/60' : 'text-foreground',
        )}
        {...field}
      >
        <option value="" disabled>
          {placeholder}
        </option>

        {options.map((option) => (
          <option key={option.value} value={option.value} className="text-foreground bg-card">
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDownIcon
        aria-hidden="true"
        className="text-tan pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2"
      />
    </div>
  );
}
