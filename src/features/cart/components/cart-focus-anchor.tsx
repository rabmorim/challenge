import { CART_FOCUS_ANCHOR_ID } from '@/features/cart/constants/cart';
import { CART_COPY } from '@/features/cart/constants/cart-copy';

/**
 * Ponto de pouso do foco depois que uma linha do carrinho é removida.
 *
 * Remover apaga do DOM a própria lixeira que abriu a confirmação, então o Radix
 * não tem para onde devolver o foco e ele cai no `body` — quem navega por
 * teclado teria de recomeçar do topo da página a cada item removido. Quem faz o
 * desvio é `CartRemoveButton`, pelo `onCloseAutoFocus` do diálogo.
 *
 * É um destino invisível e fora da ordem de tabulação (`tabindex="-1"`), com
 * texto próprio: ao receber o foco, o leitor de tela anuncia onde a pessoa
 * está, e o `Tab` seguinte continua de onde a lista recomeça. Nenhum pixel
 * muda — o frame não desenha nada aqui, e `sr-only` é `position: absolute`,
 * então o elemento não abre vão nos containers com `gap`.
 */
export function CartFocusAnchor() {
  return (
    <div id={CART_FOCUS_ANCHOR_ID} tabIndex={-1} className="sr-only">
      {CART_COPY.focusAnchor}
    </div>
  );
}
