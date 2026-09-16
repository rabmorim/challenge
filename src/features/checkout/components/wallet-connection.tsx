import { Button } from '@/components/ui/button';
import { WALLET_PROVIDER_LABELS } from '@/features/checkout/constants/checkout';
import { CHECKOUT_COPY, WALLET_COPY } from '@/features/checkout/constants/checkout-copy';
import { walletIdentity, walletStatusLabel } from '@/features/checkout/lib/wallet-format';
import type { WalletConnectionProps } from '@/features/checkout/types/checkout-components';

/**
 * Estado da conexão da carteira escolhida, com a ação correspondente.
 *
 * O Figma não desenha este bloco — ele desenha o mundo em que a carteira já
 * está conectada. Mas conexão, recusa e desconexão são simulações exigidas pelo
 * enunciado, e elas precisam de um lugar onde o estado seja **visível e
 * reversível**: sem isso, escolher a carteira desconectada deixaria o botão de
 * confirmar travado sem explicação. Segue o padrão visual do resto da coluna,
 * como o enunciado pede para estados não desenhados.
 *
 * O estado não depende só de cor: ele vem escrito ("Conectada", "Desconectada",
 * "Conexão recusada") ao lado do apelido da carteira.
 *
 * @param props - Carteiras, seleção corrente e travamento durante o envio.
 */
export function WalletConnection({ wallets, disabled }: WalletConnectionProps) {
  const wallet = wallets.selected;

  if (wallets.isError) {
    return (
      <div role="alert" data-testid="wallets-error" className="flex flex-col items-start gap-2">
        <p className="text-tan text-caption">{wallets.error?.message ?? WALLET_COPY.loadError}</p>
        <Button variant="link" size="inline" className="text-caption" onClick={wallets.refetch}>
          {CHECKOUT_COPY.errorRetry}
        </Button>
      </div>
    );
  }

  if (!wallet) {
    return (
      <output data-testid="wallet-missing" className="text-tan text-caption">
        {wallets.provider
          ? `Você não tem uma carteira ${WALLET_PROVIDER_LABELS[wallets.provider]} cadastrada.`
          : WALLET_COPY.emptyDescription}
      </output>
    );
  }

  const isBusy = wallets.pendingWalletId === wallet.id;
  const isConnected = wallet.status === 'connected';

  // Carteira conectada e sem falha e o estado que o frame desenha: nada a
  // resolver, nada a mostrar. O bloco aparece so quando ha — e e ai que ele
  // impede o botao de confirmar ficar travado sem explicacao. Desconectar
  // continua disponivel nos cartoes do frame de 414.
  if (isConnected && !wallets.connectionError) return null;

  return (
    <div data-testid="wallet-connection" className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-tan text-caption truncate">
          {wallet.label} · {walletIdentity(wallet)}
        </p>

        <Button
          variant="link"
          size="inline"
          data-testid={isConnected ? 'wallet-disconnect' : 'wallet-connect'}
          disabled={disabled || isBusy}
          className="text-caption shrink-0"
          onClick={() => {
            if (isConnected) wallets.disconnect(wallet);
            else wallets.connect(wallet);
          }}
        >
          {isBusy
            ? WALLET_COPY.connecting
            : isConnected
              ? WALLET_COPY.disconnect
              : WALLET_COPY.connect}
        </Button>
      </div>

      <p data-testid="wallet-status" className="text-tan text-caption">
        {walletStatusLabel(wallet)}
      </p>

      {wallets.connectionError && (
        <p data-testid="wallet-connection-error" role="alert" className="text-destructive text-caption">
          {wallets.connectionError.message}
        </p>
      )}
    </div>
  );
}
