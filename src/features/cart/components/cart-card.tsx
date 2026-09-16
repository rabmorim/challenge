import { Link } from '@tanstack/react-router';

import { nftDetailPath } from '@/constants/routes';
import { CartRemoveButton } from '@/features/cart/components/cart-remove-button';
import { CartStepper } from '@/features/cart/components/cart-stepper';
import { CART_CARD_THUMB_SIZE } from '@/features/cart/constants/cart';
import { CART_COPY } from '@/features/cart/constants/cart-copy';
import type { CartItemProps } from '@/features/cart/types/cart-components';
import { formatEth } from '@/lib/eth';

/**
 * Card de item do frame de 414.
 *
 * A composição é outra, e não a tabela encolhida: arte à esquerda, nome,
 * tiragem e preço empilhados, e o seletor de quantidade à direita. O preço aqui
 * é o **total da linha** (é o valor que o frame mostra em accent ao lado de uma
 * quantidade maior que um), porque no celular não há coluna "Total" separada.
 *
 * O seletor fica numa linha só, centrado na altura do card, como no frame. A
 * lixeira sobe para o canto superior direito: no Figma ela aparece desenhada
 * por cima do "+" de um dos cards, e as duas não cabem no mesmo lugar — o canto
 * é o espaço vazio do card, e é o único jeito de manter o seletor na linha do
 * frame sem espremer o nome do NFT. O desvio está registrado no
 * `ARCHITECTURE.md`.
 *
 * @param props - Linha e as ações do carrinho.
 */
export function CartCard({ item, actions }: CartItemProps) {
  const isBusy = actions.pendingItemId === item.id;

  return (
    <li
      data-testid="cart-row"
      data-nft={item.nftId}
      className="bg-card rounded-media relative flex h-[100px] items-stretch overflow-hidden"
    >
      <img
        src={item.imageUrl}
        alt=""
        width={CART_CARD_THUMB_SIZE}
        height={CART_CARD_THUMB_SIZE}
        loading="lazy"
        decoding="async"
        className="size-[100px] shrink-0 object-cover"
      />

      <div className="flex min-w-0 flex-1 items-center gap-2.5 py-3 pr-2.5 pl-2.5">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h2 className="text-card-mobile font-bold">
            <Link to={nftDetailPath(item.slug)} className="rounded-control">
              {item.name}
            </Link>
          </h2>

          <p className="text-tan text-[13px] leading-4">{CART_COPY.edition(item.edition.total)}</p>

          <p className="text-primary text-[17px] leading-5 font-bold">
            <span className="sr-only">{CART_COPY.lineTotalLabel(item.name)}: </span>
            <span data-testid="cart-line-total">{formatEth(item.lineTotal)}</span>
          </p>
        </div>

        <CartStepper
          item={item}
          isBusy={isBusy}
          variant="compact"
          onChange={(quantity) => {
            actions.setQuantity(item, quantity);
          }}
        />
      </div>

      {/* Fora do fluxo: assim ela ocupa o canto vazio do card sem tirar
          largura do nome nem deslocar o seletor do centro. */}
      <div className="absolute top-1 right-1">
        <CartRemoveButton
          item={item}
          isBusy={isBusy}
          onConfirm={() => {
            actions.removeItem(item);
          }}
        />
      </div>
    </li>
  );
}
