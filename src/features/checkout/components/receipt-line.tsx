import { CHECKOUT_THUMB_SIZE } from '@/features/checkout/constants/checkout';
import { RECEIPT_COPY } from '@/features/checkout/constants/checkout-copy';
import type { ReceiptLineProps } from '@/features/checkout/types/checkout-components';
import { formatEth } from '@/lib/eth';

/**
 * Linha de "Detalhes da transação".
 *
 * Os valores vêm do **snapshot** do pedido, não do catálogo: o item já foi
 * comprado por aquele preço, e uma mudança posterior no mercado não pode
 * reescrever o recibo.
 *
 * @param props - Item do pedido, como o servidor o congelou.
 */
export function ReceiptLine({ item }: ReceiptLineProps) {
  return (
    <li data-testid="receipt-line" className="grid grid-cols-[1fr_auto_auto] items-center gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <img
          src={item.imageUrl}
          alt={item.imageAlt}
          width={CHECKOUT_THUMB_SIZE}
          height={CHECKOUT_THUMB_SIZE}
          loading="lazy"
          decoding="async"
          className="rounded-control size-16 shrink-0 object-cover"
        />

        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-body-lg truncate font-bold">{item.name}</p>
          <p className="text-tan text-caption truncate">{RECEIPT_COPY.tokenId(item.tokenId)}</p>
        </div>
      </div>

      <span className="text-tan text-caption">{RECEIPT_COPY.editions(item.quantity)}</span>

      <span className="text-primary text-body-lg text-right font-bold">
        {formatEth(item.lineTotal)}
      </span>
    </li>
  );
}
