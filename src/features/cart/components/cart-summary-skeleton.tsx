import { CART_SUMMARY_COPY } from '@/features/cart/constants/cart-copy';
import { CART_SUMMARY_SKELETON_ROWS } from '@/features/cart/constants/cart';
import type { CartSummarySkeletonProps } from '@/features/cart/types/cart-components';
import { cn } from '@/lib/utils';

/**
 * Esqueleto do resumo — o componente que o enunciado §8 cita por nome.
 *
 * Reproduz a caixa do resumo carregado: título, campo de cupom, quatro linhas
 * de valor e o botão. As alturas são as finais, então o resumo não cresce nem
 * encolhe quando a cotação chega.
 *
 * Ele aparece **só no primeiro carregamento**. Numa recotagem os valores
 * anteriores ficam na tela marcados como "atualizando" (ver `CartSummary`).
 *
 * @param props - Variante visual (sidebar de 1440 ou painel de 414).
 */
export function CartSummarySkeleton({ variant }: CartSummarySkeletonProps) {
  const isPanel = variant === 'panel';

  return (
    <output
      data-testid="cart-summary-skeleton"
      aria-label={CART_SUMMARY_COPY.title}
      className={cn(
        'flex flex-col',
        isPanel ? 'surface-gradient gap-5 rounded-t-[40px] px-6 pt-6 pb-8' : 'gap-6',
      )}
    >
      {!isPanel && (
        <div className="border-divider border-b pb-2.5">
          <div className="skeleton h-4 w-40 rounded-sm" />
        </div>
      )}

      <div className={cn('skeleton w-full', isPanel ? 'h-14 rounded-full' : 'rounded-control h-10')} />

      <div className="flex flex-col gap-4">
        {Array.from({ length: CART_SUMMARY_SKELETON_ROWS }, (_unused, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="skeleton h-4 w-32 rounded-sm" />
            <div className="skeleton h-4 w-20 rounded-sm" />
          </div>
        ))}
      </div>

      <div className={cn('skeleton w-full', isPanel ? 'h-14 rounded-full' : 'rounded-control h-10')} />
    </output>
  );
}
