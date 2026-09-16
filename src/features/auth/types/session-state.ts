import type { Session } from '@/features/auth/types/session';
import type { AuthenticatedUser } from '@/features/auth/types/user';

/**
 * Estado de autenticacao do cliente.
 *
 * Nao autenticado e um ESTADO, nao um erro: `UNAUTHENTICATED` vindo da API vira
 * `anonymous`/`expired` aqui, e `isError` da query fica reservado a falha real
 * (rede, 5xx). Sem isso, visitante entraria em retry e error boundary.
 */
export type SessionState =
  | { status: 'anonymous' }
  | { status: 'expired' }
  | { status: 'authenticated'; session: Session; user: AuthenticatedUser };

/** Leitura derivada da sessao, usada pelos componentes. */
export interface SessionSnapshot {
  /** Estado bruto, util em `switch` exaustivo. */
  state: SessionState;
  /** Usuario autenticado, ou `null`. */
  user: AuthenticatedUser | null;
  /** `true` somente quando ha sessao valida. */
  isAuthenticated: boolean;
  /** `true` enquanto a sessao e consultada pela primeira vez. */
  isPending: boolean;
  /** `true` quando a consulta falhou por motivo que nao e de sessao. */
  isError: boolean;
}
