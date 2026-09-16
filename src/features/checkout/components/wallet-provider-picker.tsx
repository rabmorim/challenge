import { WALLET_PROVIDER_ORDER } from '@/features/checkout/constants/checkout';
import { WALLET_COPY } from '@/features/checkout/constants/checkout-copy';
import { WalletProviderOption } from '@/features/checkout/components/wallet-provider-option';
import type { WalletProviderPickerProps } from '@/features/checkout/types/checkout-components';

/**
 * Bloco "Carteira e rede": os três provedores do layout.
 *
 * Marcar um provedor escolhe a carteira cadastrada dele — provedor e carteira
 * são a mesma decisão para quem está comprando. Quando o usuário não tem
 * carteira daquele provedor, a seleção fica sem dona e quem diz isso é
 * `WalletConnection`, logo abaixo: fingir uma conexão seria o "sucesso
 * funcional aparente" que o enunciado proíbe.
 *
 * `radiogroup` com rótulo próprio para o leitor de tela anunciar o conjunto
 * antes das opções.
 *
 * @param props - Estado das carteiras, variante do frame e travamento.
 */
export function WalletProviderPicker({ wallets, variant, disabled }: WalletProviderPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label={WALLET_COPY.providerGroupLabel}
      data-testid="wallet-provider-picker"
      className="flex flex-col gap-3"
    >
      {WALLET_PROVIDER_ORDER.map((provider) => (
        <WalletProviderOption
          key={provider}
          provider={provider}
          variant={variant}
          disabled={disabled}
          isSelected={wallets.provider === provider}
          onSelect={wallets.selectProvider}
        />
      ))}
    </div>
  );
}
