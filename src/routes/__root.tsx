import { Outlet, createRootRouteWithContext, useRouterState } from '@tanstack/react-router';

import { MobileNav } from '@/components/mobile-nav';
import { NotFound } from '@/components/not-found';
import { RouteDevtools } from '@/components/route-devtools';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { ROUTES_WITHOUT_MOBILE_NAV } from '@/constants/navigation';
import { ensureSession } from '@/features/auth/api/session-query';
import { AuthDialog } from '@/features/auth/components/auth-dialog';
import { useSessionExpiryWatcher } from '@/features/auth/hooks/use-session-expiry-watcher';
import { useSocketIdentity } from '@/features/auth/hooks/use-socket-identity';
import { validateAuthSearch } from '@/features/auth/lib/auth-search';
import { cn } from '@/lib/utils';
import type { RouterContext } from '@/types/router';

/**
 * Layout raiz do app.
 *
 * Alem do esqueleto comum (link de pular navegacao, header, regiao principal),
 * monta aqui — uma unica vez — os dois observadores do ciclo de vida da sessao:
 * o que reage a expiracao detectada em qualquer requisicao e o que mantem o
 * tempo real anunciado com a identidade corrente.
 *
 * A barra de atalhos do celular e a folga que ela pede saem juntas nas rotas
 * que desenham o proprio rodape (ver `ROUTES_WITHOUT_MOBILE_NAV`): uma decisao
 * so, para a pagina nunca reservar espaco para uma barra que nao existe.
 */
function RootLayout() {
  useSessionExpiryWatcher();
  useSocketIdentity();

  const hasMobileNav = useRouterState({
    select: (state) =>
      !state.matches.some((match) => ROUTES_WITHOUT_MOBILE_NAV.includes(match.routeId)),
  });

  return (
    <>
      <a className="skip-link" href="#main">
        Pular para o conteúdo
      </a>
      <div data-testid="app-shell" className="flex min-h-dvh flex-col">
        <SiteHeader />
        {/* O respiro inferior no celular existe para o fim da pagina nao ficar
            atras da barra de atalhos (78px) nem do atalho central, que sobe
            36px acima dela. */}
        <main id="main" className={cn('flex-1', hasMobileNav && 'pb-28 md:pb-0')}>
          <Outlet />
        </main>
        <SiteFooter />
        {hasMobileNav && <MobileNav />}
      </div>
      <AuthDialog />
      <RouteDevtools />
    </>
  );
}

/**
 * Rota raiz — tipada com o contexto compartilhado (`queryClient`).
 *
 * `beforeLoad` resolve a sessao antes de qualquer rota renderizar: e o que
 * torna a sessao recuperavel apos refresh e o que permite aos guards decidirem
 * sem hook, inclusive no acesso direto a uma rota privada. O estado resolvido
 * entra no contexto das rotas filhas.
 */
export const Route = createRootRouteWithContext<RouterContext>()({
  validateSearch: validateAuthSearch,
  beforeLoad: async ({ context }) => ({ session: await ensureSession(context.queryClient) }),
  component: RootLayout,
  notFoundComponent: NotFound,
});
