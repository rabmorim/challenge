import { useId } from 'react';

import { Button } from '@/components/ui/button';
import { BuyNote } from '@/features/nft-detail/components/buy-note';
import { useBuyIntent } from '@/features/nft-detail/hooks/use-buy-intent';
import type { BuyActionsProps } from '@/features/nft-detail/types/detail-components';

/**
 * Botão de compra do painel do frame de 1440.
 *
 * A decisão de o que acontece ao acionar vive em `useBuyIntent` — a mesma regra
 * que a barra fixa do celular usa: com sessão, a quantidade escolhida vai para
 * o carrinho; sem sessão, abre o painel de autenticação. A explicação do estado
 * fica em `BuyNote`, ligada ao botão por `aria-describedby`.
 *
 * @param props - NFT exibido e a quantidade escolhida.
 */
export function BuyActions({ nft, quantity }: BuyActionsProps) {
  const intent = useBuyIntent(nft, quantity);
  const noteId = useId();

  return (
    <div className="flex flex-col gap-2">
      <Button
        data-testid="buy-button"
        aria-describedby={noteId}
        className="w-full px-8 py-3.5 sm:w-fit"
        disabled={intent.isDisabled}
        onClick={intent.trigger}
      >
        {intent.label}
      </Button>

      <BuyNote id={noteId} nft={nft} quantity={quantity} />
    </div>
  );
}
