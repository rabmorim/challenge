import { AlertTriangleIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { STALE_QUOTE_COPY } from '@/features/checkout/constants/checkout-copy';
import type { StaleQuoteNoticeProps } from '@/features/checkout/types/checkout-components';
import { formatEth } from '@/lib/eth';

/**
 * O bloqueio por cotação desatualizada.
 *
 * É o aviso que cumpre a última linha do cenário do enunciado §7: a compra não
 * pode ser confirmada com valores que o servidor já não honra, e o usuário
 * precisa **ver o que mudou** antes de confirmar de novo. Por isso a lista traz
 * o preço cotado ao lado do preço atual, e a disponibilidade pedida ao lado da
 * restante — a mesma informação que os `conflicts` do erro carregam.
 *
 * `role="alert"` porque o aviso interrompe a ação em curso; o botão de aceitar
 * fica travado enquanto a cotação nova está a caminho, já que aceitar valores
 * que ainda não chegaram seria confirmar no escuro.
 *
 * @param props - Estado do portão.
 */
export function StaleQuoteNotice({ gate }: StaleQuoteNoticeProps) {
  if (!gate.block) return null;

  const { block } = gate;

  return (
    <section
      role="alert"
      data-testid="stale-quote-notice"
      className="border-primary rounded-control flex flex-col gap-3 border p-4"
    >
      <h3 className="text-body-lg flex items-start gap-2 font-bold">
        <AlertTriangleIcon className="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {STALE_QUOTE_COPY.title}
      </h3>

      <p className="text-tan text-caption">{block.message || STALE_QUOTE_COPY.description}</p>

      {block.conflicts.length > 0 && (
        <ul data-testid="stale-quote-conflicts" className="text-tan text-caption flex flex-col gap-1.5">
          {block.conflicts.map((conflict) => (
            <li key={conflict.nftId}>
              {conflict.quotedPrice === conflict.currentPrice
                ? STALE_QUOTE_COPY.availabilityLine(
                    conflict.name,
                    conflict.requestedQuantity,
                    conflict.availableQuantity,
                  )
                : STALE_QUOTE_COPY.priceLine(
                    conflict.name,
                    formatEth(conflict.quotedPrice),
                    formatEth(conflict.currentPrice),
                  )}
            </li>
          ))}
        </ul>
      )}

      <Button
        data-testid="stale-quote-acknowledge"
        disabled={gate.isRefreshing}
        onClick={gate.acknowledge}
      >
        {gate.isRefreshing ? STALE_QUOTE_COPY.acknowledging : STALE_QUOTE_COPY.acknowledge}
      </Button>
    </section>
  );
}
