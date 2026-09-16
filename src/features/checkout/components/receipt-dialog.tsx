import { XIcon } from 'lucide-react';

import { SummaryRow } from '@/components/summary-row';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { NETWORKS } from '@/constants/network';
import { ReceiptLine } from '@/features/checkout/components/receipt-line';
import { ReceiptExplorer } from '@/features/checkout/components/receipt-explorer';
import { ReceiptMeta } from '@/features/checkout/components/receipt-meta';
import { THANK_YOU_ICON } from '@/features/checkout/constants/checkout';
import { RECEIPT_COPY } from '@/features/checkout/constants/checkout-copy';
import { formatReceiptDate } from '@/features/checkout/lib/format-receipt-date';
import { maskAddress } from '@/features/checkout/lib/wallet-format';
import { useReturnFocus } from '@/features/auth/hooks/use-return-focus';
import type { ReceiptDialogProps } from '@/features/checkout/types/checkout-components';
import { formatEthPrecise } from '@/lib/eth';

/**
 * Confirmação de pedido — o recibo (`design/Confirmação de Pedido.png`).
 *
 * **Só aparece para pedido efetivamente confirmado pela simulação**, e o
 * conteúdo vem de `GET /orders/:id/receipt`: o snapshot que o servidor congelou
 * no instante em que o pedido virou terminal. É por isso que um `nft.updated`
 * posterior não muda um número aqui — não há nada neste arquivo lendo o
 * catálogo.
 *
 * O diálogo é o primitivo do Radix, então foco preso, `Esc` e `aria-modal` vêm
 * prontos; `useReturnFocus` devolve o foco a quem estava com ele, porque a
 * abertura não parte de um `DialogTrigger` — quem abre é a chegada do evento.
 *
 * **"Ver no Etherscan" é um no-op coerente.** A transação é simulada: navegar
 * para um explorador real mostraria "não encontrado", e abrir um link falso
 * seria aparentar sucesso funcional — o que o enunciado proíbe. O botão explica
 * isso, no lugar.
 *
 * Mobile: o Figma não traz frame. A versão responsiva mantém a mesma ordem em
 * tela cheia (o desvio está registrado no ARCHITECTURE).
 *
 * @param props - Recibo, abertura e o fechamento.
 */
export function ReceiptDialog({ receipt, isOpen, onClose }: ReceiptDialogProps) {
  useReturnFocus(isOpen);

  if (!receipt) return null;

  const { order } = receipt;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        data-testid="receipt-dialog"
        aria-describedby={undefined}
        className={[
          'inset-0 flex h-dvh w-full flex-col overflow-y-auto',
          'sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[92dvh] sm:w-[580px]',
          'sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-panel',
          'border-b-4 border-b-primary',
        ].join(' ')}
      >
        <DialogClose asChild>
          <Button variant="ghost" size="icon" className="text-primary absolute top-3 right-3">
            <XIcon className="size-5" aria-hidden="true" />
            <span className="sr-only">{RECEIPT_COPY.close}</span>
          </Button>
        </DialogClose>

        <DialogTitle className="sr-only">{RECEIPT_COPY.dialogTitle}</DialogTitle>

        <header className="flex flex-col items-center gap-4 px-6 pt-8 pb-6">
          {/* Decorativa: o título logo abaixo já diz o que a arte ilustra. */}
          <img
            src={THANK_YOU_ICON.src}
            alt=""
            width={THANK_YOU_ICON.size}
            height={THANK_YOU_ICON.size}
            className="size-[66px]"
          />
          <p className="text-tan text-body-lg text-center">{RECEIPT_COPY.headline}</p>
        </header>

        <dl className="border-divider flex items-start justify-between border-y px-6 py-3 [&>*+*]:border-l [&>*+*]:border-[color:var(--kurio-divider)]">
          <ReceiptMeta
            label={RECEIPT_COPY.transactionId}
            value={maskAddress(order.transactionHash ?? '')}
            testId="receipt-transaction-id"
            isStrong
          />
          <ReceiptMeta
            label={RECEIPT_COPY.date}
            value={formatReceiptDate(order.updatedAt)}
            testId="receipt-date"
          />
          <ReceiptMeta label={RECEIPT_COPY.total} value={formatEthPrecise(order.totals.total)} />
          <ReceiptMeta label={RECEIPT_COPY.wallet} value={maskAddress(order.walletAddress)} isStrong />
        </dl>

        <section
          aria-label={RECEIPT_COPY.detailsTitle}
          className="flex flex-col items-stretch gap-4 px-6 py-5"
        >
          <h3 className="text-body-lg font-bold">{RECEIPT_COPY.detailsTitle}</h3>

          <div className="text-tan text-caption grid grid-cols-[1fr_auto_auto] gap-3">
            <span>{RECEIPT_COPY.itemsHeader}</span>
            <span>{RECEIPT_COPY.editionsHeader}</span>
            <span className="text-right">{RECEIPT_COPY.subtotalHeader}</span>
          </div>

          <ul className="flex flex-col gap-4">
            {order.items.map((item) => (
              <ReceiptLine key={item.nftId} item={item} />
            ))}
          </ul>

          <dl className="flex w-[62%] flex-col gap-3 self-end pt-2">
            <SummaryRow
              label={RECEIPT_COPY.networkFee}
              value={formatEthPrecise(order.totals.networkFee)}
            />
            <SummaryRow
              label={RECEIPT_COPY.total}
              value={formatEthPrecise(order.totals.total)}
              isTotal
            />
          </dl>
        </section>

        <footer className="border-divider flex flex-col items-center gap-4 border-t px-6 py-5">
          <p className="text-tan text-modal max-w-[420px] text-center">
            {RECEIPT_COPY.note(NETWORKS[order.network].label)}
          </p>

          {/* `key` pelo pedido: o aviso é estado local e recomeça fechado
              quando outro recibo é aberto. */}
          <ReceiptExplorer key={order.id} />
        </footer>
      </DialogContent>
    </Dialog>
  );
}
