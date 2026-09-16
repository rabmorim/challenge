import { CartRemoveButton } from '@/features/cart/components/cart-remove-button';
import { CartStepper } from '@/features/cart/components/cart-stepper';
import { CART_THUMB_SIZE } from '@/features/cart/constants/cart';
import { CART_COPY } from '@/features/cart/constants/cart-copy';
import type { CartItemProps } from '@/features/cart/types/cart-components';
import { nftDetailPath } from '@/constants/routes';
import { formatEth } from '@/lib/eth';
import { Link } from '@tanstack/react-router';

import { cn } from '@/lib/utils';

/**
 * Classe comum às células: superfície da linha e o respiro de 13px acima dela.
 * `bg-clip-padding` faz o fundo parar na borda, que assim fica transparente e
 * deixa o fundo da página aparecer entre as linhas.
 */
const CELL = 'bg-card bg-clip-padding border-t-[13px] border-t-transparent px-0';

/**
 * Linha da tabela do frame de 1440.
 *
 * A miniatura tem dimensões declaradas e a linha tem altura fixa (70px, como o
 * frame), então a chegada da arte não desloca a tabela nem o resumo ao lado.
 *
 * O preço fica no tan e o total da linha no accent claro — são cores diferentes
 * no Figma, e a diferença é o que separa "quanto custa a peça" de "quanto esta
 * linha soma".
 *
 * @param props - Linha e as ações do carrinho.
 */
export function CartTableRow({ item, actions }: CartItemProps) {
  const isBusy = actions.pendingItemId === item.id;

  return (
    // O fundo e o respiro vivem nas células: no modelo de bordas separadas, a
    // borda transparente de cada célula é o que abre os 13px entre as linhas do
    // frame sem herdar o vão duplicado da fronteira `thead`/`tbody`.
    <tr data-testid="cart-row" data-nft={item.nftId}>
      {/* Cabeçalho da linha: o nome do NFT é o que identifica as demais
          células, e `scope="row"` faz o leitor de tela anunciá-lo ao entrar em
          "Preço", "Edições" e "Total". */}
      <th scope="row" className={cn(CELL, 'rounded-l-panel h-[70px] font-normal')}>
        <div className="flex items-center gap-5">
          <img
            src={item.imageUrl}
            alt=""
            width={CART_THUMB_SIZE}
            height={CART_THUMB_SIZE}
            loading="lazy"
            decoding="async"
            className="rounded-panel size-[70px] shrink-0 object-cover"
          />

          <span className="flex min-w-0 flex-col gap-1 text-left">
            <Link
              to={nftDetailPath(item.slug)}
              className="rounded-control text-[15px] leading-4 font-bold"
            >
              {item.name}
            </Link>
            <span className="text-icon-muted text-[13px] leading-4">
              {CART_COPY.tokenId} #{item.tokenId}
            </span>
          </span>
        </div>
      </th>

      <td className={cn(CELL, 'text-tan text-body-lg')}>{formatEth(item.unitPrice)}</td>

      <td className={CELL}>
        <CartStepper
          item={item}
          isBusy={isBusy}
          onChange={(quantity) => {
            actions.setQuantity(item, quantity);
          }}
        />
      </td>

      <td className={CELL}>
        <span className="sr-only">{CART_COPY.lineTotalLabel(item.name)}</span>
        <span data-testid="cart-line-total" className="text-link text-body-lg font-bold">
          {formatEth(item.lineTotal)}
        </span>
      </td>

      <td className={cn(CELL, 'rounded-r-panel')}>
        <CartRemoveButton
          item={item}
          isBusy={isBusy}
          onConfirm={() => {
            actions.removeItem(item);
          }}
        />
      </td>
    </tr>
  );
}
