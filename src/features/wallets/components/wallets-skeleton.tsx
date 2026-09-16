import { WALLET_SKELETON_FIELDS } from '@/features/wallets/constants/wallets';

/**
 * Esqueleto da tela de carteiras.
 *
 * As medidas são as do conteúdo real — rótulo de 20px, campo de 46px, a mesma
 * grade de duas colunas — para que o formulário **pouse no lugar** quando
 * chegar. Um bloco de altura arbitrária empurraria a coluna, que é exatamente o
 * deslocamento de layout que a auditoria mede.
 *
 * O shimmer vem da classe `.skeleton`, que já respeita movimento reduzido.
 */
export function WalletsSkeleton() {
  return (
    <div data-testid="wallets-skeleton" aria-hidden="true" className="flex flex-col gap-10">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <div className="skeleton rounded-control h-5 w-44" />
          <div className="skeleton rounded-control h-4 w-full max-w-[520px]" />
        </div>

        <div className="grid grid-cols-1 gap-x-7 gap-y-8 md:grid-cols-2">
          {Array.from({ length: WALLET_SKELETON_FIELDS }, (_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <div className="skeleton rounded-control h-5 w-32" />
              <div className="skeleton rounded-control h-[46px] w-full" />
            </div>
          ))}
        </div>

        <div className="skeleton rounded-control h-[38px] w-36" />
      </div>

      <div className="flex flex-col gap-2">
        <div className="skeleton rounded-control h-5 w-48" />
        <div className="skeleton rounded-control h-4 w-72" />
      </div>
    </div>
  );
}
