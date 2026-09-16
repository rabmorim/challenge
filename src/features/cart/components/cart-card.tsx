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
 * A lixeira fica abaixo do seletor. No Figma ela aparece desenhada por cima do
 * "+" de um dos cards — as duas não cabem no mesmo lugar, e sem ela o celular
 * ficaria sem remover; o desvio está registrado no `ARCHITECTURE.md`.
 *
 * @param props - Linha e as ações do carrinho.
 */
export function CartCard({ item, actions }: CartItemProps) {
  const isBusy = actions.pendingItemId === item.id;

  return (
    <li
      data-testid="cart-row"
      data-nft={item.nftId}
      className="bg-card rounded-media flex h-[100px] items-stretch overflow-hidden"
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

        <div className="flex w-20 shrink-0 flex-col items-center gap-1">
          <CartStepper
            item={item}
            isBusy={isBusy}
            variant="compact"
            onChange={(quantity) => {
              actions.setQuantity(item, quantity);
            }}
          />

          <CartRemoveButton
            item={item}
            isBusy={isBusy}
            onConfirm={() => {
              actions.removeItem(item);
            }}
          />
        </div>
      </div>
    </li>
  );
}
