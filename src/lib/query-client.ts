import { QueryClient } from '@tanstack/react-query';

import { QUERY_DEFAULTS } from '@/constants/query';
import { isHttpError } from '@/lib/http';

/**
 * Decide se uma query deve ser repetida apos falha.
 * Erros de contrato (4xx) nao sao repetidos; falhas transitorias e de rede sim.
 *
 * @param failureCount - Quantidade de tentativas ja realizadas.
 * @param error - Erro devolvido pela ultima tentativa.
 * @returns `true` enquanto valer a pena tentar de novo.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= QUERY_DEFAULTS.retry) return false;
  if (!isHttpError(error)) return false;
  return (
    error.code === 'TRANSIENT_FAILURE' ||
    error.code === 'NETWORK_ERROR' ||
    error.code === 'TIMEOUT'
  );
}

/**
 * Cria um `QueryClient` com a politica de cache/retry do projeto.
 * Uma fabrica (e nao um singleton exportado) mantem os testes isolados:
 * cada cenario monta o proprio cache.
 *
 * @returns Instancia configurada do `QueryClient`.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_DEFAULTS.staleTimeMs,
        gcTime: QUERY_DEFAULTS.gcTimeMs,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
        // Reconexao dispara a reconciliacao dos recursos ativos com o REST.
        refetchOnReconnect: true,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
