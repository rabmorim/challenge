import { Outlet, createFileRoute } from '@tanstack/react-router';

import { AccountShell } from '@/components/account/account-shell';

/**
 * Layout da area da conta — a moldura "Meu perfil" dos dois frames.
 *
 * E uma rota sem caminho proprio, filha de `_private`: as telas mantem as URLs
 * do design (`/perfil`, `/carteiras`) e herdam de uma vez o guard de sessao e a
 * barra lateral. Herdar o guard por composicao, e nao repeti-lo em cada tela, e
 * o que garante que uma rota nova da conta nasca protegida.
 */
export const Route = createFileRoute('/_private/_account')({
  component: AccountLayout,
});

/**
 * Monta a barra lateral em volta da tela aberta.
 */
function AccountLayout() {
  return (
    <AccountShell>
      <Outlet />
    </AccountShell>
  );
}
