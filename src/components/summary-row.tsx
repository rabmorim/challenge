import type { SummaryRowProps } from '@/types/components';
import { cn } from '@/lib/utils';

/**
 * Linha rótulo/valor do resumo.
 *
 * `dt`/`dd` em vez de dois `span`: o resumo é uma lista de pares, e a
 * associação faz o leitor de tela anunciar "Subtotal, 26.83 ETH" em vez de dois
 * textos soltos que só a posição na tela relaciona.
 *
 * O total não se distingue apenas pela cor — ele é o único em negrito, e o
 * rótulo continua escrito por extenso.
 *
 * Vive fora das features porque carrinho e pagamento mostram o mesmo resumo:
 * duas cópias divergiriam na primeira correção de espaçamento.
 *
 * **A nota ("Taxa estimada") muda de lugar entre os dois frames**: no carrinho
 * ela fica alinhada à direita, sob o valor; no pagamento, centralizada na
 * largura da coluna. A variante centralizada monta a linha como grade e deixa o
 * `dd` em `display: contents`, para os filhos dele participarem da mesma grade
 * — assim a nota atravessa as duas colunas sem que um elemento solto precise
 * entrar no meio do `dl`.
 *
 * @param props - Rótulo, valor, realce de total, nota e o alinhamento dela.
 */
export function SummaryRow({
  label,
  value,
  isTotal = false,
  note,
  noteAlign = 'end',
}: SummaryRowProps) {
  const isCentered = noteAlign === 'center';

  return (
    <div
      className={cn(
        isCentered
          ? 'grid grid-cols-[auto_1fr] items-start gap-x-4'
          : 'flex items-start justify-between gap-4',
        isTotal && 'mt-2',
      )}
    >
      <dt className={cn('text-body-lg', isTotal && 'font-bold')}>{label}</dt>

      <dd className={cn(isCentered ? 'contents' : 'flex flex-col items-end gap-1.5')}>
        <span
          data-testid={isTotal ? 'summary-total' : undefined}
          className={cn(
            'text-body-lg',
            isCentered && 'text-right',
            isTotal && 'text-link font-bold',
          )}
        >
          {value}
        </span>

        {note && (
          <span
            className={cn(
              'text-link text-[11px] leading-4',
              isCentered && 'col-span-2 mt-1.5 text-center',
            )}
          >
            {note}
          </span>
        )}
      </dd>
    </div>
  );
}
