import { CHECKOUT_THUMB_SIZE } from '@/features/checkout/constants/checkout';
import { RECEIPT_COPY } from '@/features/checkout/constants/checkout-copy';
import type { OrderSummaryLineProps } from '@/features/checkout/types/checkout-components';
import { formatEth } from '@/lib/eth';

/**
 * Linha do resumo "Seus NFTs": miniatura, nome, id do token, edições e subtotal.
 *
 * A miniatura carrega `width`/`height` explícitos: a arte chega depois do
 * layout, e sem a caixa reservada a coluna inteira saltaria quando a imagem
 * pousasse — é o CLS que a auditoria mede.
 *
 * O texto das edições vem entre parênteses como no frame e fica fora do nome
 * acessível do link de nada: a linha é informativa, não é um controle.
 *
 * @param props - Dados da linha, já vindos da API.
 */
export function OrderSummaryLine({
  name,
  tokenId,
  imageUrl,
  imageAlt,
  quantity,
  lineTotal,
}: OrderSummaryLineProps) {
  return (
    <li
      data-testid="checkout-summary-line"
      className="bg-card rounded-control flex items-center gap-3 p-1.5"
    >
      <img
        src={imageUrl}
        alt={imageAlt}
        width={CHECKOUT_THUMB_SIZE}
        height={CHECKOUT_THUMB_SIZE}
        loading="lazy"
        decoding="async"
        className="rounded-control size-16 shrink-0 object-cover"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-body-lg truncate font-bold">{name}</p>
        <p className="text-tan text-caption truncate">{RECEIPT_COPY.tokenId(tokenId)}</p>
      </div>

      <span className="text-tan text-caption shrink-0">{RECEIPT_COPY.editions(quantity)}</span>

      <span className="text-primary text-body-lg shrink-0 pr-2 font-bold">
        {formatEth(lineTotal)}
      </span>
    </li>
  );
}
