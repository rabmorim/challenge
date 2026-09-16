import { MoreVerticalIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NETWORKS } from '@/constants/network';
import { WALLET_COPY } from '@/features/checkout/constants/checkout-copy';
import { walletIdentity, walletStatusLabel } from '@/features/checkout/lib/wallet-format';
import type { ConnectedWalletCardProps } from '@/features/checkout/types/checkout-components';
import { cn } from '@/lib/utils';

/**
 * Cartão de carteira do frame de 414 ("Reserva" / "Principal").
 *
 * O cartão inteiro é o rótulo do radio: no celular, alvo de toque grande vale
 * mais que um radio de 16px isolado. O menu de três pontos guarda conectar e
 * desconectar — as ações que o frame sugere com o ícone e que o enunciado exige
 * como simulação; ele fica **fora** do `label` para o toque no menu não marcar
 * a carteira sem querer.
 *
 * A identidade mostrada é o nome ENS quando existe (é o que o frame traz na
 * "Reserva") e o endereço mascarado no resto.
 *
 * @param props - Carteira, seleção, ocupação e as ações simuladas.
 */
export function ConnectedWalletCard({
  wallet,
  isSelected,
  isBusy,
  disabled,
  onSelect,
  onConnect,
  onDisconnect,
}: ConnectedWalletCardProps) {
  const isConnected = wallet.status === 'connected';

  return (
    <div
      data-testid={`wallet-card-${wallet.id}`}
      data-selected={isSelected || undefined}
      className={cn(
        'surface-gradient rounded-filter flex items-center gap-3 px-4 py-4',
        isSelected && 'ring-primary/60 ring-1',
      )}
    >
      {/* Os textos são filhos diretos do `label` (grade de duas colunas, com o
          radio ocupando a primeira): o cartão inteiro vira alvo de toque sem
          precisar de um invólucro que esconda o rótulo do controle. */}
      <label
        className={cn(
          'grid flex-1 cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-1',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <input
          type="radio"
          name="connected-wallet"
          value={wallet.id}
          checked={isSelected}
          disabled={disabled}
          onChange={() => {
            onSelect(wallet.id);
          }}
          className="accent-primary mt-1 size-4 shrink-0 cursor-pointer row-span-4"
        />
        <span className="text-body-lg font-bold">{wallet.label}</span>
        <span className="text-tan text-caption truncate">{walletIdentity(wallet)}</span>
        <span className="text-tan text-caption">
          {WALLET_COPY.networkLine(NETWORKS[wallet.network].label, wallet.role === 'primary')}
        </span>
        <span data-testid={`wallet-status-${wallet.id}`} className="text-tan text-caption">
          {walletStatusLabel(wallet)}
        </span>
      </label>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={disabled || isBusy} className="text-tan shrink-0">
            <MoreVerticalIcon className="size-5" aria-hidden="true" />
            <span className="sr-only">
              {WALLET_COPY.actionsLabel} — {wallet.label}
            </span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          {isConnected ? (
            <DropdownMenuItem
              data-testid={`wallet-disconnect-${wallet.id}`}
              onSelect={() => {
                onDisconnect(wallet);
              }}
            >
              {WALLET_COPY.disconnect}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              data-testid={`wallet-connect-${wallet.id}`}
              onSelect={() => {
                onConnect(wallet);
              }}
            >
              {WALLET_COPY.connect}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
