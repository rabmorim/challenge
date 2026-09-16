import { Button } from '@/components/ui/button';
import {
  SAME_AS_PRIMARY_HINT,
  WALLETS_COPY,
  WALLET_ROLE_TITLES,
} from '@/features/wallets/constants/wallets-copy';
import { WalletForm } from '@/features/wallets/components/wallet-form';
import type { SecondaryWalletSectionProps } from '@/features/wallets/types/wallet-components';

/**
 * Bloco "Carteira secundária" do frame.
 *
 * Sem carteira cadastrada o frame mostra o estado vazio — "Você ainda não
 * adicionou uma carteira secundária." — mais o atalho "Igual à carteira
 * principal" e o "Adicionar". Com uma cadastrada, o formulário abre já
 * preenchido, para edição.
 *
 * **"Igual à carteira principal" copia tudo menos o endereço.** O servidor
 * recusa endereço repetido do mesmo dono (`WALLET_ADDRESS_ALREADY_REGISTERED`),
 * então copiá-lo ofereceria um atalho que aparenta funcionar e falha no envio;
 * a dica ao lado diz isso em uma linha. O controle é um `radio` isolado que
 * desmarca no clique — um grupo de um item só, que não pudesse ser desmarcado,
 * prenderia o usuário na escolha.
 *
 * @param props - Estado da tela de carteiras.
 */
export function SecondaryWalletSection({ wallets }: SecondaryWalletSectionProps) {
  const title = WALLET_ROLE_TITLES.secondary;
  const isFormOpen = wallets.secondary !== null || wallets.isSecondaryOpen;

  return (
    <section aria-labelledby="wallet-secondary-title" className="flex flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="wallet-secondary-title" className="text-body-lg font-bold">
            {title}
          </h2>
          {!isFormOpen && (
            <p className="text-tan text-body" data-testid="wallet-secondary-empty">
              {WALLETS_COPY.emptySecondary}
            </p>
          )}
        </div>

        {!wallets.secondary && (
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-body flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="wallet-same-as-primary"
                data-testid="wallet-same-as-primary"
                checked={wallets.isSameAsPrimary}
                disabled={wallets.primary === null}
                aria-describedby="wallet-same-as-primary-hint"
                className="accent-primary size-4 cursor-pointer"
                onClick={() => {
                  wallets.copyFromPrimary();
                }}
                onChange={() => {
                  // A cópia é tratada no clique: repetir o clique no controle
                  // já marcado recopia os dados da principal, que é o que se
                  // espera de um atalho.
                }}
              />
              {WALLETS_COPY.sameAsPrimary}
            </label>

            <Button
              variant="link"
              size="inline"
              data-testid="wallet-secondary-add"
              onClick={wallets.openSecondary}
            >
              {WALLETS_COPY.add}
            </Button>
          </div>
        )}
      </header>

      {/* A dica pertence ao atalho: com uma secundaria ja cadastrada o radio
          nao existe, e explicar uma copia que ninguem pode pedir seria ruido. */}
      {!wallets.secondary && (
        <p id="wallet-same-as-primary-hint" className="text-tan text-caption">
          {SAME_AS_PRIMARY_HINT}
        </p>
      )}

      {isFormOpen && <WalletForm form={wallets.secondaryForm} ariaLabel={title} />}
    </section>
  );
}
