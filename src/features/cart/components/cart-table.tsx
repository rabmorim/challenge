import { CartTableRow } from '@/features/cart/components/cart-table-row';
import { CartTableRowSkeleton } from '@/features/cart/components/cart-table-row-skeleton';
import { CART_SKELETON_ROWS } from '@/features/cart/constants/cart';
import { CART_COPY } from '@/features/cart/constants/cart-copy';
import type { CartItemsProps } from '@/features/cart/types/cart-components';

/**
 * Tabela do frame de 1440.
 *
 * É uma `<table>` de verdade porque os dados são tabulares: o leitor de tela
 * anuncia "Preço", "Edições" e "Total" ao entrar em cada célula, associação que
 * uma grade de `<div>` só conseguiria repetindo o rótulo em toda linha.
 *
 * As linhas são superfícies separadas, como no frame. O respiro entre elas vem
 * de uma **borda superior transparente** nas células (com `bg-clip-padding`,
 * para o fundo da linha parar antes dela), e não de `border-spacing-y`: o
 * espaçamento do modelo de bordas separadas é aplicado também na fronteira
 * entre `thead` e `tbody`, o que dobrava o vão entre o filete e a primeira
 * linha. Com a borda, os 13px do Figma valem igual nos dois lugares.
 *
 * O filete sob os cabeçalhos para na largura da tabela — no Figma ele não
 * atravessa a goteira até a coluna do resumo.
 *
 * O esqueleto entra no `tbody`, com o cabeçalho já montado: as larguras de
 * coluna existem desde o primeiro quadro, então a chegada dos dados não desloca
 * a tabela nem a coluna do resumo ao lado.
 *
 * @param props - Linhas, ações do carrinho e o estado do carregamento.
 */
export function CartTable({ items, actions, isPending }: CartItemsProps) {
  return (
    <table
      data-testid="cart-table"
      className="w-full border-separate border-spacing-0 text-left"
    >
      <caption className="sr-only">{isPending ? CART_COPY.loadingItems : CART_COPY.title}</caption>

      <thead>
        <tr className="text-body-lg">
          <th scope="col" className="border-divider border-b pb-2.5 font-normal">
            {CART_COPY.columnNfts}
          </th>
          <th scope="col" className="border-divider w-[139px] border-b pb-2.5 font-normal">
            {CART_COPY.columnPrice}
          </th>
          <th scope="col" className="border-divider w-[135px] border-b pb-2.5 font-normal">
            {CART_COPY.columnEditions}
          </th>
          <th scope="col" className="border-divider w-[152px] border-b pb-2.5 font-normal">
            {CART_COPY.columnTotal}
          </th>
          <th scope="col" className="border-divider w-11 border-b pb-2.5">
            <span className="sr-only">{CART_COPY.columnActions}</span>
          </th>
        </tr>
      </thead>

      <tbody>
        {isPending
          ? Array.from({ length: CART_SKELETON_ROWS }, (_unused, index) => (
              // Placeholders são posicionais: o índice é o único identificador.
              <CartTableRowSkeleton key={index} />
            ))
          : items.map((item) => <CartTableRow key={item.id} item={item} actions={actions} />)}
      </tbody>
    </table>
  );
}
