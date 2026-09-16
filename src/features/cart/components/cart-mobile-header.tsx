import { ChevronLeftIcon } from 'lucide-react';

import { CART_COPY } from '@/features/cart/constants/cart-copy';
import { useBackNavigation } from '@/hooks/use-back-navigation';

/**
 * Cabeçalho do frame de 414: seta de voltar e o título centralizado.
 *
 * A seta usa o histórico do router; quando o carrinho foi aberto direto pela
 * URL ela leva ao Mercado, em vez de sumir — no celular ela é a única saída
 * desenhada no frame.
 */
export function CartMobileHeader() {
  const back = useBackNavigation();

  return (
    <div className="relative flex items-center justify-center">
      <button
        type="button"
        data-testid="cart-back"
        aria-label={CART_COPY.back}
        onClick={back.goBack}
        className="border-border bg-surface-lift text-tan absolute left-0 flex size-[35px] cursor-pointer items-center justify-center rounded-full border"
      >
        <ChevronLeftIcon className="size-5" aria-hidden="true" />
      </button>

      <h1 className="text-title">{CART_COPY.title}</h1>
    </div>
  );
}
