import { Outlet, createFileRoute } from '@tanstack/react-router';

import { requireAuth } from '@/features/auth/lib/require-auth';

/**
 * Layout das rotas privadas (checkout, perfil, carteiras, favoritos, pedidos).
 *
 * E uma rota sem caminho proprio: as filhas mantem a URL do design e herdam o
 * guard. Como a verificacao acontece em `beforeLoad`, a tela protegida nunca
 * chega a renderizar sem sessao — nem no acesso direto, nem no refresh.
 */
export const Route = createFileRoute('/_private')({
  beforeLoad: ({ context, location }) => {
    requireAuth({ session: context.session, href: location.href });
  },
  component: Outlet,
});
