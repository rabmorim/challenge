import type { ReceiptMetaProps } from '@/features/checkout/types/checkout-components';
import { cn } from '@/lib/utils';

/**
 * Um campo da faixa do recibo ("ID da transação | Data | Total | Carteira").
 *
 * `dt`/`dd`, e não dois `span`: a faixa é uma lista de pares, e a associação
 * faz o leitor de tela anunciar "Data, 29 Jul, 2026" em vez de dois textos
 * soltos que só a posição na tela relaciona. As divisórias verticais entre os
 * campos são desenhadas por quem monta a faixa, com borda — nada de caractere
 * de barra que o leitor de tela teria que soletrar.
 *
 * @param props - Rótulo, valor, realce e o marcador de teste.
 */
export function ReceiptMeta({ label, value, isStrong = false, testId }: ReceiptMetaProps) {
  return (
    <div data-testid={testId} className="flex min-w-0 flex-col gap-1 px-3 first:pl-0 last:pr-0">
      <dt className={cn('text-caption', isStrong ? 'text-foreground font-bold' : 'text-tan')}>
        {label}
      </dt>
      <dd className="text-tan text-caption truncate">{value}</dd>
    </div>
  );
}
