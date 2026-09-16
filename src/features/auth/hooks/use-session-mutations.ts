import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { useCallback } from 'react';
import { toast } from 'sonner';

import { login, logout, signUp } from '@/features/auth/api/auth-api';
import { sessionQueryOptions } from '@/features/auth/api/session-query';
import { AUTH_COPY, SESSION_MESSAGES } from '@/features/auth/constants/auth';
import { switchSessionIdentity } from '@/features/auth/lib/session-lifecycle';
import type {
  LoginRequest,
  LogoutResponse,
  SessionResponse,
  SignUpRequest,
} from '@/features/auth/types/session';
import type { SessionState } from '@/features/auth/types/session-state';
import type { NormalizedHttpError } from '@/types/http';

/**
 * Mutations de sessao: cadastro, login e logout.
 *
 * As tres compartilham a mesma regra — quem muda de identidade limpa o que
 * pertencia a identidade anterior (cache privado e conexao de tempo real)
 * ANTES de publicar a nova. Sem isso, um refetch da sessao nova poderia
 * resolver junto de uma query da sessao antiga e misturar dados de contas
 * diferentes na mesma tela.
 */

/**
 * Publica no cliente a sessao devolvida por login/cadastro.
 *
 * @returns Funcao que troca a identidade e confirma a sessao com a API.
 */
function useSessionActivation(): (response: SessionResponse) => void {
  const queryClient = useQueryClient();

  return useCallback(
    (response: SessionResponse) => {
      switchSessionIdentity(queryClient, response.user.id);
      const authenticated: SessionState = {
        status: 'authenticated',
        session: response.session,
        user: response.user,
      };
      queryClient.setQueryData(sessionQueryOptions().queryKey, authenticated);
      // Refetch imediato: a resposta do login popula a tela, mas quem confirma
      // a sessao e o servidor — inclusive quando ela ja nasce vencida.
      void queryClient.invalidateQueries({ queryKey: sessionQueryOptions().queryKey });
    },
    [queryClient],
  );
}

/**
 * Autentica o colecionador.
 *
 * @returns Mutation tipada de login.
 */
export function useLoginMutation(): UseMutationResult<
  SessionResponse,
  NormalizedHttpError,
  LoginRequest
> {
  const activate = useSessionActivation();

  return useMutation({
    mutationFn: login,
    onSuccess: (response) => {
      activate(response);
      toast.success(AUTH_COPY.signIn.success);
    },
  });
}

/**
 * Cria a conta e ja abre a sessao.
 *
 * @returns Mutation tipada de cadastro.
 */
export function useSignUpMutation(): UseMutationResult<
  SessionResponse,
  NormalizedHttpError,
  SignUpRequest
> {
  const activate = useSessionActivation();

  return useMutation({
    mutationFn: signUp,
    onSuccess: (response) => {
      activate(response);
      toast.success(AUTH_COPY.signUp.success);
    },
  });
}

/**
 * Encerra a sessao.
 *
 * A limpeza fica em `onSettled` de proposito: token, cache privado e socket
 * saem mesmo se a chamada falhar — sessao local nao pode sobreviver a uma
 * tentativa de sair. `router.invalidate()` reavalia os guards, o que expulsa
 * quem estava numa rota privada.
 *
 * @returns Mutation tipada de logout.
 */
export function useLogoutMutation(): UseMutationResult<LogoutResponse, NormalizedHttpError, void> {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      switchSessionIdentity(queryClient, null);
      const anonymous: SessionState = { status: 'anonymous' };
      queryClient.setQueryData(sessionQueryOptions().queryKey, anonymous);
      void router.invalidate();
      toast.success(SESSION_MESSAGES.loggedOut);
    },
  });
}
