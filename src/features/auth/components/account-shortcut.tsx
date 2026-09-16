import { AccountMenu } from '@/features/auth/components/account-menu';
import { SignInButton } from '@/features/auth/components/sign-in-button';
import { useSession } from '@/features/auth/hooks/use-session';

/**
 * Atalho de conta da barra de celulares.
 *
 * O frame de 414 desenha um glifo de pessoa no fim da barra e nenhum header —
 * é por aqui que se entra e se sai da conta no celular. Visitante abre o painel
 * de autenticação; com sessão, o mesmo lugar abre o menu com "Meu perfil" e
 * "Sair", os dois destinos que o header cobre no desktop.
 *
 * Enquanto a sessão é consultada, ocupa exatamente o espaço do controle final
 * (44px), para a barra não saltar quando a resposta chega.
 */
export function AccountShortcut() {
  const { isAuthenticated, user, isPending } = useSession();

  if (isPending) {
    return <div className="skeleton size-11 rounded-full" aria-hidden="true" />;
  }

  return isAuthenticated && user ? (
    <AccountMenu user={user} variant="icon" />
  ) : (
    <SignInButton variant="icon" />
  );
}
