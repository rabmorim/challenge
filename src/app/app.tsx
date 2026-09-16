import { RouterProvider } from '@tanstack/react-router';
import { useState } from 'react';

import { AppProviders } from '@/app/providers';
import { createAppRouter } from '@/app/router';
import { createQueryClient } from '@/lib/query-client';

/**
 * Raiz da aplicacao.
 *
 * Cria uma unica vez o `QueryClient` e o router — o mesmo cache alimenta os
 * providers e o contexto das rotas, garantindo invalidacao coerente entre
 * loaders e componentes.
 */
export function App() {
  const [queryClient] = useState(createQueryClient);
  const [router] = useState(() => createAppRouter(queryClient));

  return (
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
