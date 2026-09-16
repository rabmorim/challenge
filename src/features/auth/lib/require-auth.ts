import { redirect } from '@tanstack/react-router';

import { ROUTES } from '@/constants/routes';
import { AUTH_TABS } from '@/features/auth/constants/auth';
import type { RequireAuthParams } from '@/features/auth/types/auth-navigation';

/**
 * Guard das rotas privadas (checkout, perfil, carteiras, favoritos, pedidos).
 *
 * Roda em `beforeLoad`, entao a tela privada nunca chega a renderizar sem
 * sessao — e o destino pretendido viaja em `redirect` para que o fluxo seja
 * retomado exatamente onde parou depois de autenticar. Vale igual no acesso
 * direto e no refresh, porque a sessao ja foi resolvida na rota raiz.
 *
 * @param params - Estado da sessao e caminho da rota protegida.
 * @throws {Redirect} Redirecionamento para o painel de login quando nao ha sessao.
 */
export function requireAuth({ session, href }: RequireAuthParams): void {
  if (session.status === 'authenticated') return;

  throw redirect({
    to: ROUTES.home,
    search: { auth: AUTH_TABS.signIn, redirect: href },
  });
}
