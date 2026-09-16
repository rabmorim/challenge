import { useRef } from 'react';

import { Button } from '@/components/ui/button';
import { WalletForm } from '@/features/wallets/components/wallet-form';
import { WALLETS_COPY, WALLET_ROLE_TITLES } from '@/features/wallets/constants/wallets-copy';
import type { PrimaryWalletSectionProps } from '@/features/wallets/types/wallet-components';

/**
 * Bloco "Carteira principal" do frame.
 *
 * O formulário fica sempre aberto, como o frame desenha: ele **edita** a
 * principal quando ela existe e a **cadastra** quando não — o hook decide o
 * verbo, a tela não muda de forma.
 *
 * O "Adicionar" do canto direito leva o foco ao primeiro campo do formulário.
 * A leitura foi escolhida por eliminação: abrir um segundo bloco de principal
 * prometeria duas, e o servidor só mantém uma (promover outra rebaixa a
 * anterior) — um botão que oferece o que não acontece é o "fluxo apenas visual"
 * que o enunciado proíbe. Como atalho de foco ele é honesto e serve nos dois
 * estados, inclusive para quem navega por teclado.
 *
 * @param props - Estado da tela de carteiras.
 */
export function PrimaryWalletSection({ wallets }: PrimaryWalletSectionProps) {
  const title = WALLET_ROLE_TITLES.primary;
  const formRef = useRef<HTMLDivElement>(null);

  return (
    <section aria-labelledby="wallet-primary-title" className="flex flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 id="wallet-primary-title" className="text-body-lg font-bold">
            {title}
          </h2>
          <p className="text-tan text-body">{WALLETS_COPY.description}</p>
        </div>

        <Button
          variant="link"
          size="inline"
          data-testid="wallet-primary-add"
          onClick={() => {
            formRef.current?.querySelector('input')?.focus();
          }}
        >
          {WALLETS_COPY.add}
        </Button>
      </header>

      <div ref={formRef}>
        <WalletForm form={wallets.primaryForm} ariaLabel={title} />
      </div>
    </section>
  );
}
