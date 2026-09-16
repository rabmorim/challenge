import { Button } from '@/components/ui/button';
import { CHECKOUT_COPY, WALLET_COPY } from '@/features/checkout/constants/checkout-copy';
import { ConnectedWalletCard } from '@/features/checkout/components/connected-wallet-card';
import type { ConnectedWalletsProps } from '@/features/checkout/types/checkout-components';

/**
 * "Carteira conectada" — a lista de cartões do frame de 414.
 *
 * Mostra as carteiras **cadastradas** do colecionador; cadastrar e editar
 * pertencem à tela de carteiras, então aqui a lista é só leitura e escolha
 * (mais conectar/desconectar, que é estado de conexão, não cadastro).
 *
 * Sem carteira nenhuma a compra não tem como seguir, e a tela diz isso em vez
 * de mostrar uma lista vazia sem explicação. Falha ao ler a lista é outro
 * estado, com outra saída: tentar de novo.
 *
 * @param props - Estado das carteiras e travamento durante o envio.
 */
export function ConnectedWallets({ wallets, disabled }: ConnectedWalletsProps) {
  // Falha de leitura nao pode virar "voce nao tem carteiras": sao coisas
  // diferentes, e so uma delas tem conserto pelo botao.
  if (wallets.isError) {
    return (
      <div role="alert" data-testid="wallets-error" className="flex flex-col items-start gap-3">
        <p className="text-tan text-caption">{wallets.error?.message ?? WALLET_COPY.loadError}</p>
        <Button variant="outline" size="sm" onClick={wallets.refetch}>
          {CHECKOUT_COPY.errorRetry}
        </Button>
      </div>
    );
  }

  if (wallets.wallets.length === 0) {
    return (
      <output data-testid="wallets-empty" className="flex flex-col gap-1">
        <p className="text-body-lg font-bold">{WALLET_COPY.emptyTitle}</p>
        <p className="text-tan text-caption">{WALLET_COPY.emptyDescription}</p>
      </output>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label={WALLET_COPY.walletGroupLabel}
      data-testid="connected-wallets"
      className="flex flex-col gap-3"
    >
      {wallets.wallets.map((wallet) => (
        <ConnectedWalletCard
          key={wallet.id}
          wallet={wallet}
          isSelected={wallets.selected?.id === wallet.id}
          isBusy={wallets.pendingWalletId === wallet.id}
          disabled={disabled}
          onSelect={wallets.select}
          onConnect={wallets.connect}
          onDisconnect={wallets.disconnect}
        />
      ))}
    </div>
  );
}
