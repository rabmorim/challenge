import { CART_SKELETON_ROWS } from '@/features/cart/constants/cart';
import { CART_COPY } from '@/features/cart/constants/cart-copy';

/**
 * Esqueleto da lista de cards (frame de 414).
 *
 * Ocupa exatamente a caixa dos cards reais — 100px de altura e o mesmo respiro
 * entre eles —, para que a chegada dos dados não desloque a lista nem o painel
 * do resumo abaixo. O shimmer vem da classe `.skeleton` do tema, que a
 * preferência por movimento reduzido congela.
 */
export function CartCardsSkeleton() {
  return (
    <output
      data-testid="cart-skeleton"
      aria-label={CART_COPY.loadingItems}
      className="flex flex-col gap-5"
    >
      {Array.from({ length: CART_SKELETON_ROWS }, (_unused, index) => (
        // Placeholders são posicionais: o índice é o único identificador que existe.
        <div key={index} className="skeleton rounded-media h-[100px] w-full" />
      ))}
    </output>
  );
}
