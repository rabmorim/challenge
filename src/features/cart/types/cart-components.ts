import type { CartItem } from '@/features/cart/types/cart';
import type { CartMutationsApi } from '@/features/cart/types/cart-state';
import type { QuoteSummaryApi } from '@/features/checkout/types/quote-summary';
import type { NftSummary } from '@/features/catalog/types/nft';
import type { Quantity } from '@/types/api';

/** Props dos componentes do carrinho. */

/** Props da lista de itens (tabela de 1440 e cards de 414). */
export interface CartItemsProps {
  items: CartItem[];
  actions: CartMutationsApi;
  /** `true` no primeiro carregamento: o `tbody` recebe linhas de esqueleto. */
  isPending: boolean;
}

/** Props de uma linha ou card de item. */
export interface CartItemProps {
  item: CartItem;
  actions: CartMutationsApi;
}

/** Props do seletor de quantidade do carrinho. */
export interface CartStepperProps {
  item: CartItem;
  /** `true` enquanto a mutation da linha está em voo. */
  isBusy: boolean;
  onChange: (quantity: Quantity) => void;
  /** `compact` é a variante de círculos do frame de 414. */
  variant?: 'default' | 'compact';
}

/** Props do botão de remover, que pede confirmação. */
export interface CartRemoveButtonProps {
  item: CartItem;
  isBusy: boolean;
  onConfirm: () => void;
}

/** Props do resumo de valores. */
export interface CartSummaryProps {
  quote: QuoteSummaryApi;
  /** `sidebar` é a coluna de 1440; `panel` é o bloco do rodapé de 414. */
  variant: 'sidebar' | 'panel';
  /** Aciona o gate de sessão ou a navegação para o checkout. */
  onCheckout: () => void;
  /** `true` enquanto o carrinho ainda não respondeu — o CTA fica inerte. */
  isCartPending: boolean;
}

/** Props do formulário de cupom. */
export interface CouponFormProps {
  quote: QuoteSummaryApi;
  variant: 'sidebar' | 'panel';
}

/** Props do esqueleto do resumo. */
export interface CartSummarySkeletonProps {
  variant: 'sidebar' | 'panel';
}

/** Props da seção "Colecionadores também viram". */
export interface AlsoViewedProps {
  items: NftSummary[];
  isPending: boolean;
}

/** Props do estado de falha do carrinho. */
export interface CartErrorProps {
  message: string;
  onRetry: () => void;
}
