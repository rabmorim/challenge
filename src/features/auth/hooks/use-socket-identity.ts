import { useEffect } from 'react';

import { useSession } from '@/features/auth/hooks/use-session';
import { resetSocketSession } from '@/features/realtime/api/socket-client';

/**
 * Mantem o tempo real anunciado com a identidade da sessao corrente.
 *
 * Cobre o caso que as mutations nao veem: a sessao recuperada do token depois
 * de um refresh. `resetSocketSession` e no-op quando a identidade nao mudou,
 * entao refetch de sessao nao provoca reconexao.
 */
export function useSocketIdentity(): void {
  const { user } = useSession();
  const userId = user?.id ?? null;

  useEffect(() => {
    resetSocketSession(userId);
  }, [userId]);
}
