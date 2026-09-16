import type { QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';

/** Props de `AppProviders`. */
export interface AppProvidersProps {
  /** Cache compartilhado entre a arvore React e o contexto do router. */
  queryClient: QueryClient;
  /** Arvore que consome o cache e os toasts. */
  children: ReactNode;
}
