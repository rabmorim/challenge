import { LiveRegion } from '@/components/live-region';
import { Button } from '@/components/ui/button';
import { PrimaryWalletSection } from '@/features/wallets/components/primary-wallet-section';
import { SecondaryWalletSection } from '@/features/wallets/components/secondary-wallet-section';
import { WalletsSkeleton } from '@/features/wallets/components/wallets-skeleton';
import { WALLETS_COPY } from '@/features/wallets/constants/wallets-copy';
import { useWallets } from '@/features/wallets/hooks/use-wallets';

/**
 * Tela "Carteiras" (`design/Carteiras.png`).
 *
 * Dois blocos, um por papel. A tela resolve `loading`, `error` e `success` aqui
 * — os blocos só existem com dados na mão, e nenhum deles precisa saber que a
 * consulta pode falhar.
 *
 * A região viva é uma só para as duas: o anúncio de "carteira salva" ou de
 * "revise os campos" vale para quem estiver em qualquer um dos blocos, e duas
 * regiões concorreriam pela mesma fala.
 */
export function WalletsScreen() {
  const wallets = useWallets();

  if (wallets.isPending) return <WalletsSkeleton />;

  if (wallets.isError) {
    return (
      <div role="alert" data-testid="wallets-load-error" className="flex flex-col items-start gap-3">
        <h1 className="text-body-lg font-bold">{WALLETS_COPY.sectionLabel}</h1>
        <p className="text-tan text-body">{wallets.error?.message ?? WALLETS_COPY.loadError}</p>
        <Button variant="outline" size="sm" onClick={wallets.refetch}>
          {WALLETS_COPY.retry}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {/* O frame não desenha o nome da seção fora da barra lateral, mas a
          página precisa de um cabeçalho de nível um para quem navega por
          marcos — daí o título existir só para o leitor de tela. */}
      <h1 className="sr-only">{WALLETS_COPY.sectionLabel}</h1>
      <LiveRegion testId="wallets-status" message={wallets.announcement} />
      <PrimaryWalletSection wallets={wallets} />
      <SecondaryWalletSection wallets={wallets} />
    </div>
  );
}
