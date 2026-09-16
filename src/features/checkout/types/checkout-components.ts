import type { ReactNode } from 'react';

import type { CartItem } from '@/features/cart/types/cart';
import type { OrderItem, OrderReceipt } from '@/features/checkout/types/order';
import type {
  CheckoutGateApi,
  CheckoutScreenState,
  CheckoutStep,
  CollectorFormApi,
  OrderSubmitApi,
  WalletSelectionApi,
} from '@/features/checkout/types/checkout-state';
import type { QuoteSummaryApi } from '@/features/checkout/types/quote-summary';
import type { Wallet, WalletProvider } from '@/features/wallets/types/wallet';
import type { EthAmount, Quantity } from '@/types/api';

/** Props dos componentes do pagamento e da confirmacao. */

/** Props de `CollectorForm`. */
export interface CollectorFormProps {
  form: CollectorFormApi;
  /** Trava os campos enquanto o pedido esta em voo. */
  isLocked: boolean;
}

/** Opcao de um seletor do formulario. */
export interface SelectOption {
  value: string;
  label: string;
}

/** Props de `CheckoutSelect`. */
export interface CheckoutSelectProps {
  id: string;
  value: string;
  options: readonly SelectOption[];
  /** Texto da opcao vazia ("Selecione uma rede"). */
  placeholder: string;
  disabled?: boolean;
  'aria-describedby'?: string | undefined;
  'aria-invalid'?: boolean | undefined;
  /**
   * Avisa a escolha do usuario.
   *
   * @param value - Valor selecionado.
   */
  onChange: (value: string) => void;
}

/** Props de `OrderSummary` — a coluna "Seus NFTs" do frame de 1440. */
export interface OrderSummaryProps {
  items: readonly CartItem[];
  quote: QuoteSummaryApi;
  wallets: WalletSelectionApi;
  order: OrderSubmitApi;
  gate: CheckoutGateApi;
  canSubmit: boolean;
}

/** Props de `OrderSummaryLine`. */
export interface OrderSummaryLineProps {
  name: string;
  tokenId: string;
  imageUrl: string;
  imageAlt: string;
  quantity: Quantity;
  lineTotal: EthAmount;
}

/** Props de `SummaryValues` — as linhas de subtotal, desconto, taxa e total. */
export interface SummaryValuesProps {
  quote: QuoteSummaryApi;
}

/** Props de `CouponDisclosure`. */
export interface CouponDisclosureProps {
  quote: QuoteSummaryApi;
}

/** Props de `WalletProviderPicker`. */
export interface WalletProviderPickerProps {
  wallets: WalletSelectionApi;
  /** `compact` e a composicao do frame de 414 (selo + radio a direita). */
  variant: 'sidebar' | 'compact';
  disabled: boolean;
}

/** Props de `WalletProviderOption`. */
export interface WalletProviderOptionProps {
  provider: WalletProvider;
  isSelected: boolean;
  variant: 'sidebar' | 'compact';
  disabled: boolean;
  /**
   * Marca este provedor.
   *
   * @param provider - Provedor escolhido.
   */
  onSelect: (provider: WalletProvider) => void;
}

/** Props de `WalletConnection`. */
export interface WalletConnectionProps {
  wallets: WalletSelectionApi;
  disabled: boolean;
}

/** Props de `ConnectedWallets` — os cartoes "Reserva/Principal" do frame de 414. */
export interface ConnectedWalletsProps {
  wallets: WalletSelectionApi;
  disabled: boolean;
}

/** Props de `ConnectedWalletCard`. */
export interface ConnectedWalletCardProps {
  wallet: Wallet;
  isSelected: boolean;
  isBusy: boolean;
  disabled: boolean;
  /**
   * Marca esta carteira como a que vai pagar.
   *
   * @param walletId - Id da carteira.
   */
  onSelect: (walletId: string) => void;
  /**
   * Conecta a carteira (simulado).
   *
   * @param wallet - Carteira a conectar.
   */
  onConnect: (wallet: Wallet) => void;
  /**
   * Desconecta a carteira (simulado).
   *
   * @param wallet - Carteira a desconectar.
   */
  onDisconnect: (wallet: Wallet) => void;
}

/** Props de `StaleQuoteNotice`. */
export interface StaleQuoteNoticeProps {
  gate: CheckoutGateApi;
}

/** Props de `OrderStatusNotice`. */
export interface OrderStatusNoticeProps {
  order: OrderSubmitApi;
}

/** Props de `CheckoutDesktop`. */
export interface CheckoutLayoutProps {
  checkout: CheckoutScreenState;
}

/** Props de `CheckoutMobile`. */
export interface CheckoutMobileProps extends CheckoutLayoutProps {
  /** Etapa corrente, lida da URL. */
  step: CheckoutStep;
  /**
   * Navega para outra etapa (entra no historico).
   *
   * @param step - Etapa de destino.
   */
  onStepChange: (step: CheckoutStep) => void;
  /** Sai do pagamento pela seta de voltar da primeira etapa. */
  onBack: () => void;
}

/** Props de `ReceiptDialog`. */
export interface ReceiptDialogProps {
  receipt: OrderReceipt | null;
  isOpen: boolean;
  /** Fecha o recibo (X do frame ou `Esc`). */
  onClose: () => void;
}

/** Props de `ReceiptLine`. */
export interface ReceiptLineProps {
  item: OrderItem;
}

/** Props de `ReceiptMeta` — a faixa "ID da transação / Data / Total / Carteira". */
export interface ReceiptMetaProps {
  label: string;
  value: string;
  /** O primeiro campo da faixa vem em negrito no frame. */
  isStrong?: boolean;
  /**
   * Marcador de teste. Os campos cujo valor muda a cada compra (hash e data)
   * o recebem para a regressao visual poder mascara-los.
   */
  testId?: string;
}

/** Props de `CheckoutSection` — moldura de titulo + conteudo. */
export interface CheckoutSectionProps {
  title: string;
  children: ReactNode;
}
