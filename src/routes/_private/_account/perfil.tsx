import { createFileRoute } from '@tanstack/react-router';

import { ROUTE_SEO } from '@/constants/seo';
import { routeHead } from '@/lib/route-head';

import { ProfileScreen } from '@/features/profile/components/profile-screen';

/**
 * Dados do perfil do colecionador.
 *
 * Rota privada: o guard vive no layout `_private` que a envolve, e a barra
 * lateral "Meu perfil" no `_account`. Acesso direto e refresh funcionam porque
 * a sessao e resolvida em `beforeLoad`, antes de qualquer render.
 */
export const Route = createFileRoute('/_private/_account/perfil')({
  head: () => routeHead(ROUTE_SEO.profile),
  component: ProfileScreen,
});
