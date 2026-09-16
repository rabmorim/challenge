import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { sessionQueryOptions } from '@/features/auth/api/session-query';
import { SESSION_MESSAGES } from '@/features/auth/constants/auth';
import { switchSessionIdentity } from '@/features/auth/lib/session-lifecycle';
import type { SessionState } from '@/features/auth/types/session-state';
import { subscribeToSessionExpiry } from '@/lib/session-expiry';

/**
 * Reage a expiracao da sessao detectada em qualquer requisicao.
 *
 * O interceptor do Axios apenas avisa (ele nao conhece cache nem rotas); a
 * reacao mora aqui: derrubar o que era privado e reavaliar os guards.
 * `router.invalidate()` faz o guard da rota atual disparar de novo — e e ele
 * quem redireciona para o login guardando o destino, de modo que a retomada do
 * fluxo funciona igual para qualquer tela privada, sem caso especial.
 *
 * Montado uma unica vez na raiz; a assinatura e desfeita na desmontagem.
 */
export function useSessionExpiryWatcher(): void {
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(
    () =>
      subscribeToSessionExpiry(({ reason }) => {
        switchSessionIdentity(queryClient, null);
        const expired: SessionState = { status: 'expired' };
        queryClient.setQueryData(sessionQueryOptions().queryKey, expired);
        void router.invalidate();
        toast.warning(
          reason === 'SESSION_EXPIRED' ? SESSION_MESSAGES.expired : SESSION_MESSAGES.invalid,
        );
      }),
    [queryClient, router],
  );
}
