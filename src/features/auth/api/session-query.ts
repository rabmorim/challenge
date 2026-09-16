import { queryOptions, type QueryClient } from '@tanstack/react-query';

import { fetchSession } from '@/features/auth/api/auth-api';
import type { SessionState } from '@/features/auth/types/session-state';
import { isHttpError } from '@/lib/http';
import { queryKeys } from '@/lib/query-keys';
import { clearSessionToken, getSessionToken } from '@/lib/request-identity';

/**
 * Consulta da sessao — fonte de verdade do estado de autenticacao.
 *
 * Roda no carregamento do app (`beforeLoad` da rota raiz), o que torna a sessao
 * recuperavel apos refresh: o token persistido e trocado por usuario e validade
 * na API simulada, em vez de o cliente confiar no que guardou.
 */

/**
 * Resolve o estado da sessao a partir do token local.
 *
 * Sem token, nao ha requisicao: seria um 401 garantido a cada carregamento de
 * visitante. Com token, o 401 vira estado (`expired`/`anonymous`) em vez de
 * erro — falha de rede e 5xx, essas sim, continuam erro e sao repetidas pela
 * politica do cache.
 *
 * `expired` sobrevive a revalidacao de proposito: depois de a sessao vencer nao
 * ha mais token, e sem esta excecao a proxima revalidacao devolveria
 * `anonymous` e apagaria da tela a explicacao de por que o usuario foi parar no
 * login.
 *
 * @param client - Cache do app, para consultar o estado anterior.
 * @param signal - `AbortSignal` do TanStack Query.
 * @returns Estado da sessao.
 * @throws {NormalizedHttpError} Em falhas que nao sejam de autenticacao.
 */
async function loadSessionState(client: QueryClient, signal: AbortSignal): Promise<SessionState> {
  if (!getSessionToken()) {
    const previous = client.getQueryData<SessionState>(queryKeys.session());
    return previous?.status === 'expired' ? { status: 'expired' } : { status: 'anonymous' };
  }

  try {
    const { session, user } = await fetchSession(signal);
    return { status: 'authenticated', session, user };
  } catch (error) {
    if (isHttpError(error) && error.code === 'UNAUTHENTICATED') {
      // O token nao vale mais; mante-lo so produziria novos 401.
      clearSessionToken();
      return { status: error.reason === 'SESSION_EXPIRED' ? 'expired' : 'anonymous' };
    }

    throw error;
  }
}

/**
 * Opcoes tipadas da query de sessao.
 *
 * `retry: false` porque 401 e contrato, nao falha transitoria; e a key vive
 * fora dos escopos `public`/`user` porque e ela quem define o escopo dos
 * outros recursos.
 *
 * `staleTime: 0` e deliberado, contra o padrao do projeto: a sessao pode ser
 * revogada ou vencer do lado do servidor sem que o cliente fique sabendo, entao
 * cada navegacao a revalida. E o que faz a expiracao aparecer durante o uso, e
 * nao so no proximo refresh — e a requisicao e barata (sem token, nem sai).
 *
 * @returns Objeto pronto para `useQuery` / `ensureQueryData`.
 */
export function sessionQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.session(),
    queryFn: ({ client, signal }) => loadSessionState(client, signal),
    retry: false,
    staleTime: 0,
  });
}

/**
 * Garante que a sessao esteja resolvida antes de a rota renderizar.
 *
 * `revalidateIfStale` mantem a navegacao instantanea (responde do cache) e
 * ainda assim confere com o servidor em segundo plano: se a sessao caiu, o 401
 * dispara o aviso de expiracao, que reavalia os guards e leva ao login com o
 * destino guardado.
 *
 * @param queryClient - Cache do app.
 * @returns Estado da sessao (do cache, se ja houver).
 */
export async function ensureSession(queryClient: QueryClient): Promise<SessionState> {
  return queryClient.ensureQueryData({ ...sessionQueryOptions(), revalidateIfStale: true });
}
