import { useQuery } from '@tanstack/react-query';

import { sessionQueryOptions } from '@/features/auth/api/session-query';
import type { SessionSnapshot } from '@/features/auth/types/session-state';

/**
 * Le a sessao corrente — unica fonte de verdade de autenticacao na interface.
 *
 * Nao autenticado nao e erro: a query devolve `anonymous`/`expired` como
 * estado, entao `isError` aqui significa falha real (rede, 5xx) e permite a
 * tela oferecer nova tentativa em vez de tratar visitante como falha.
 *
 * @returns Estado da sessao e os derivados usados pelos componentes.
 */
export function useSession(): SessionSnapshot {
  const { data, isPending, isError } = useQuery(sessionQueryOptions());
  const state = data ?? { status: 'anonymous' as const };

  return {
    state,
    user: state.status === 'authenticated' ? state.user : null,
    isAuthenticated: state.status === 'authenticated',
    isPending,
    isError,
  };
}
