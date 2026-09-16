import { DETAIL_COPY } from '@/features/nft-detail/constants/detail';
import type { BuyNoteProps } from '@/features/nft-detail/types/detail-components';
import { cn } from '@/lib/utils';

/**
 * Nota ligada aos botões de compra por `aria-describedby`.
 *
 * Nenhum frame escreve a disponibilidade nem o teto por pedido, então a nota
 * fica invisível — mas existe: quem não vê o "+" parar de responder precisa
 * saber o motivo. Ela só aparece desenhada quando a edição esgota, porque aí o
 * frame não vale: o estado bloqueia a compra e precisa ser dito na tela.
 *
 * @param props - Id referenciado pelos botões, NFT exibido e quantidade atual.
 */
export function BuyNote({ id, nft, quantity }: BuyNoteProps) {
  const isSoldOut = nft.edition.available === 0;

  return (
    <p
      id={id}
      data-testid="buy-note"
      className={cn('text-tan text-body', !isSoldOut && 'sr-only')}
    >
      {isSoldOut
        ? DETAIL_COPY.editionUnavailable
        : DETAIL_COPY.quantityHint(nft.edition.available, nft.edition.maxPerOrder)}
      <span className="sr-only"> Quantidade escolhida: {quantity}.</span>
    </p>
  );
}
