import { queryOptions } from '@tanstack/react-query';

import { fetchFavorites } from '@/features/catalog/api/favorites-api';
import { CATALOG_QUERY_SEGMENTS } from '@/features/catalog/constants/catalog';
import { queryKeys } from '@/lib/query-keys';

/**
 * Query dos favoritos do usuário autenticado.
 *
 * Vive no escopo privado com o `userId` dentro da chave: o cache do usuário A
 * nunca casa com a consulta do usuário B, mesmo antes de qualquer limpeza, e o
 * logout remove o ramo inteiro.
 *
 * @param userId - Dono dos favoritos.
 * @returns Opções da query de favoritos.
 */
export function favoritesQueryOptions(userId: string) {
  return queryOptions({
    queryKey: queryKeys.private(userId, CATALOG_QUERY_SEGMENTS.favorites),
    queryFn: ({ signal }) => fetchFavorites(signal),
  });
}
