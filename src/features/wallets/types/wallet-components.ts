import type { WalletFormApi, WalletsApi } from '@/features/wallets/types/wallet-state';

/** Props dos componentes da tela de carteiras. */

/** Props de `WalletForm`. */
export interface WalletFormProps {
  form: WalletFormApi;
  /** Rotulo acessivel do formulario ("Carteira principal"/"Carteira secundaria"). */
  ariaLabel: string;
}

/** Props de `PrimaryWalletSection`. */
export interface PrimaryWalletSectionProps {
  wallets: WalletsApi;
}

/** Props de `SecondaryWalletSection`. */
export interface SecondaryWalletSectionProps {
  wallets: WalletsApi;
}
