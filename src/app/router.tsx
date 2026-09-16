import type { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';

import { routeTree } from '@/routeTree.gen';
import { parseAppSearch, stringifyAppSearch } from '@/lib/search-serialization';

/**
 * Monta o router da aplicacao.
 *
 * Recebe o `QueryClient` por parametro (em vez de importar um singleton) para
 * que cada teste possa montar router e cache proprios, sem estado compartilhado
 * entre cenarios.
 *
 * @param queryClient - Cache que ficara disponivel no contexto das rotas.
 * @returns Router configurado e tipado.
 */
export function createAppRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient },
    // Query string em texto puro (listas separadas por virgula), para que a URL
    // do catalogo seja legivel e compartilhavel — ver `search-serialization`.
    parseSearch: parseAppSearch,
    stringifySearch: stringifyAppSearch,
    // Prefetch ao intencionar a navegacao (foco/hover), sem duplicar requisicao.
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
  });
}

/** Tipo do router — usado no `Register` abaixo e nos utilitarios de teste. */
export type AppRouter = ReturnType<typeof createAppRouter>;

declare module '@tanstack/react-router' {
  interface Register {
    router: AppRouter;
  }
}
