import {
  WALLET_PROVIDER_INITIALS,
  WALLET_PROVIDER_LABELS,
} from '@/features/checkout/constants/checkout';
import { WALLET_COPY } from '@/features/checkout/constants/checkout-copy';
import type { WalletProviderOptionProps } from '@/features/checkout/types/checkout-components';
import { cn } from '@/lib/utils';

/**
 * Uma opção do bloco "Carteira e rede".
 *
 * As duas composições do Figma desenham o mesmo controle de formas diferentes:
 * em 1440 o radio fica à esquerda e o WalletConnect aparece como o selo de
 * carteiras compatíveis (o mesmo do rodapé); em 414 cada linha traz um selo
 * redondo com a inicial, o nome escrito e o radio à direita. O **nome
 * acessível é sempre o do provedor**, inclusive na variante com o selo — o
 * selo é decorativo e o rótulo vem pelo texto invisível.
 *
 * É um `input[type=radio]` de verdade: um grupo de radios nativo já dá as setas
 * do teclado, o escopo por `name` e o anúncio de "2 de 3" no leitor de tela.
 *
 * @param props - Provedor, seleção, variante e a ação de marcar.
 */
export function WalletProviderOption({
  provider,
  isSelected,
  variant,
  disabled,
  onSelect,
}: WalletProviderOptionProps) {
  const label = WALLET_PROVIDER_LABELS[provider];
  const isCompact = variant === 'compact';
  const showsBadge = !isCompact && provider === 'walletconnect';

  return (
    <label
      data-testid={`wallet-provider-${provider}`}
      data-selected={isSelected || undefined}
      className={cn(
        'border-input flex cursor-pointer items-center gap-3 border',
        isCompact ? 'rounded-filter gap-4 px-4 py-3.5' : 'rounded-control px-4 py-2.5',
        isSelected && 'border-primary',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <input
        type="radio"
        name="wallet-provider"
        value={provider}
        checked={isSelected}
        disabled={disabled}
        onChange={() => {
          onSelect(provider);
        }}
        className={cn('accent-primary size-4 cursor-pointer', isCompact && 'order-3 ml-auto')}
      />

      {isCompact && (
        <span
          aria-hidden="true"
          className="border-primary/40 text-primary text-caption flex size-9 items-center justify-center rounded-full border font-bold"
        >
          {WALLET_PROVIDER_INITIALS[provider]}
        </span>
      )}

      {showsBadge ? (
        <>
          <span
            aria-hidden="true"
            className="bg-band border-primary text-primary rounded-control border px-2 py-1 text-[10px] leading-none"
          >
            {WALLET_COPY.compatibleBadge}
          </span>
          <span className="sr-only">{label}</span>
        </>
      ) : (
        <span className="text-body-lg">{label}</span>
      )}
    </label>
  );
}
