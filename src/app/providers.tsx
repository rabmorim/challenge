import { QueryClientProvider } from '@tanstack/react-query';

import { Toaster } from '@/components/ui/sonner';
import type { AppProvidersProps } from '@/types/providers';

/**
 * Providers globais do app: cache remoto (TanStack Query) e area de toasts.
 *
 * O `QueryClient` chega por prop porque o mesmo cache alimenta o contexto do
 * router — criar dois seria quebrar a invalidacao entre loaders e componentes.
 *
 * @param props - Cache compartilhado e arvore filha.
 */
export function AppProviders({ queryClient, children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
