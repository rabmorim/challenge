import { Link } from '@tanstack/react-router';
import { SearchIcon, ShoppingCartIcon } from 'lucide-react';

import { nftDetailPath } from '@/constants/routes';
import { MIN_ITEM_QUANTITY } from '@/features/cart/constants/cart';
import { useAddToCart } from '@/features/cart/hooks/use-add-to-cart';
import { CATALOG_COPY } from '@/features/catalog/constants/catalog-copy';
import type { NftCardActionsProps } from '@/features/catalog/types/catalog-components';

/**
 * Faixa de ações sobre a arte do card (carrinho, favoritar, lupa).
 *
 * O frame de 1440 mostra essas ações apenas no estado de ponteiro
 * (`Marketplace Page`). Aqui elas aparecem também quando **algum dos botões
 * recebe foco** (`focus-within`): sem isso, quem navega por teclado alcançaria
 * controles invisíveis. Cores e tamanho do DESIGN_SPEC §3 (`#F5F1EB`, 20px).
 *
 * No frame de 414 sobra só o coração, no canto superior direito da arte e
 * sempre visível — no toque não existe ponteiro, e uma faixa revelada no
 * `hover` deixaria favoritar inalcançável no celular. É o **mesmo** botão nos
 * dois casos: só a posição da faixa muda.
 *
 * **Este botão não exige sessão**, diferente do "COMPRAR NFT" do detalhe: o
 * carrinho aceita visitante por contrato (é para isso que existe o
 * `x-guest-id`), e é este caminho que dá itens ao carrinho anônimo — sem ele, a
 * fusão do carrinho de visitante no login (README §3) não teria como acontecer.
 *
 * @param props - NFT do card e o botão de favoritar, composto de fora.
 */
export function NftCardActions({ nft, children }: NftCardActionsProps) {
  const { addToCart, isAdding } = useAddToCart();
  const isSoldOut = nft.edition.available === 0;

  return (
    <div className="pointer-events-none absolute top-0 right-[6px] flex justify-center lg:inset-x-0 lg:top-auto lg:right-auto lg:bottom-4 lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100 lg:group-focus-within:opacity-100 lg:has-[:focus-visible]:opacity-100">
      <div className="pointer-events-auto flex items-center gap-px">
        <button
          type="button"
          data-testid="card-add-to-cart"
          disabled={isSoldOut || isAdding}
          aria-label={
            isSoldOut
              ? `${CATALOG_COPY.addToCart} ${nft.name} — ${CATALOG_COPY.addToCartSoldOut}`
              : `${CATALOG_COPY.addToCart} ${nft.name}`
          }
          onClick={() => {
            addToCart(nft.id, MIN_ITEM_QUANTITY);
          }}
          className="bg-background/85 text-foreground rounded-control hidden size-9 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-60 lg:flex"
        >
          <ShoppingCartIcon className="size-5" aria-hidden="true" />
        </button>

        {children}

        <Link
          to={nftDetailPath(nft.slug)}
          aria-label={`${CATALOG_COPY.viewDetail} ${nft.name}`}
          className="bg-background/85 text-foreground rounded-control hidden size-9 items-center justify-center lg:flex"
        >
          <SearchIcon className="size-5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
