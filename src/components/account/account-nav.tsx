import { AccountNavItemLink } from '@/components/account/account-nav-item-link';
import { AppIcon } from '@/components/app-icon';
import {
  ACCOUNT_NAV_ITEMS,
  ACCOUNT_NAV_LABEL,
  ACCOUNT_SIGNING_OUT_LABEL,
  ACCOUNT_SIGN_OUT_LABEL,
} from '@/constants/account-nav';
import { useLogoutMutation } from '@/features/auth/hooks/use-session-mutations';
import type { AccountNavProps } from '@/types/account-components';

/**
 * Lista de seções da conta — o miolo da barra lateral do frame.
 *
 * "Sair" fica fora de `ACCOUNT_NAV_ITEMS` porque não é um destino: é a mesma
 * mutation de logout do menu do header (Fase 2), que limpa o cache privado e
 * derruba a conexão de tempo real da sessão anterior. Tratá-lo como rota o
 * faria parecer uma tela.
 *
 * @param props - Aviso de navegação, usado pelo menu recolhido do celular.
 */
export function AccountNav({ onNavigate }: AccountNavProps) {
  const logout = useLogoutMutation();

  return (
    <nav aria-label={ACCOUNT_NAV_LABEL}>
      <ul className="flex flex-col">
        {ACCOUNT_NAV_ITEMS.map((item) => (
          <li key={item.label}>
            <AccountNavItemLink
              label={item.label}
              to={item.to}
              icon={item.icon}
              onNavigate={onNavigate}
            />
          </li>
        ))}

        <li className="border-input mt-1 border-t pt-1">
          <button
            type="button"
            data-testid="account-sign-out"
            disabled={logout.isPending}
            className="text-body text-primary flex w-full items-center gap-3 py-2.5 pr-3 pl-4 text-left disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => {
              logout.mutate();
            }}
          >
            <AppIcon id="logout" className="size-4" />
            {logout.isPending ? ACCOUNT_SIGNING_OUT_LABEL : ACCOUNT_SIGN_OUT_LABEL}
          </button>
        </li>
      </ul>
    </nav>
  );
}
