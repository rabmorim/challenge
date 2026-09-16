import { CHECKOUT_SKELETON_ROWS } from '@/features/checkout/constants/checkout';

/**
 * Esqueleto da coluna "Seus NFTs".
 *
 * As medidas são as do conteúdo real (linha de 76px, quatro linhas de valor de
 * 20px, botão de 46px): o esqueleto existe para o conteúdo **pousar no lugar**
 * quando chegar, e um bloco de altura arbitrária empurraria a coluna — que é
 * exatamente o deslocamento de layout que a auditoria mede.
 *
 * O shimmer vem da classe `.skeleton`, que já respeita movimento reduzido.
 */
export function OrderSummarySkeleton() {
  return (
    <div data-testid="checkout-summary-skeleton" aria-hidden="true" className="flex flex-col gap-4">
      <div className="skeleton h-5 w-28 rounded-control" />

      <ul className="flex flex-col gap-2.5">
        {Array.from({ length: CHECKOUT_SKELETON_ROWS }, (_, index) => (
          <li key={index} className="skeleton rounded-control h-[76px] w-full" />
        ))}
      </ul>

      <div className="flex flex-col gap-3.5">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="skeleton rounded-control h-5 w-full" />
        ))}
      </div>

      <div className="skeleton rounded-control h-[46px] w-full" />
    </div>
  );
}
