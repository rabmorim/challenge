import { AccountMenu } from '@/features/auth/components/account-menu';
import { SignInButton } from '@/features/auth/components/sign-in-button';
import { useSession } from '@/features/auth/hooks/use-session';

/**
 * Area de conta do header: reflete a sessao corrente.
 *
 * Enquanto a sessao e consultada, ocupa exatamente o mesmo espaco do controle
 * final — o header nao pode saltar quando a resposta chega (CLS). Falha de
 * rede cai no estado de visitante: o botao "Entrar" continua util e a proxima
 * tentativa refaz a consulta.
 */
export function AuthControl() {
  const { isAuthenticated, user, isPending } = useSession();

  if (isPending) {
    // Mesmas medidas do botao "Entrar" (100x35): a troca nao desloca o header.
    return <div className="skeleton rounded-button h-8.75 w-25" aria-hidden="true" />;
  }

  return isAuthenticated && user ? <AccountMenu user={user} /> : <SignInButton />;
}
