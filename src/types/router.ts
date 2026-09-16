import type { QueryClient } from '@tanstack/react-query';

/**
 * Contexto injetado em toda a arvore de rotas.
 * Deixar o `QueryClient` aqui permite que `loader` e `beforeLoad` façam
 * prefetch e guardas sem depender de hooks do React.
 */
export interface RouterContext {
  queryClient: QueryClient;
}
