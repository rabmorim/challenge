import { API_PATHS } from '@/constants/api';
import type {
  FavoriteMutationResponse,
  FavoritesResponse,
} from '@/features/catalog/types/favorites';
import { httpClient } from '@/lib/http';

/**
 * Chamadas REST de favoritos. Exigem sessao — sem token o servidor responde 401.
 */

/**
 * Lista os favoritos do usuario autenticado.
 *
 * @param signal - `AbortSignal` do TanStack Query.
 * @returns Ids e resumos dos NFTs favoritados.
 */
export async function fetchFavorites(signal?: AbortSignal): Promise<FavoritesResponse> {
  const { data } = await httpClient.get<FavoritesResponse>(API_PATHS.favorites, signal ? { signal } : undefined);
  return data;
}

/**
 * Favorita um NFT.
 *
 * @param nftId - NFT a favoritar.
 * @returns Estado do favorito e a contagem atualizada.
 */
export async function addFavorite(nftId: string): Promise<FavoriteMutationResponse> {
  const { data } = await httpClient.post<FavoriteMutationResponse>(API_PATHS.favorites, { nftId });
  return data;
}

/**
 * Remove um NFT dos favoritos.
 *
 * @param nftId - NFT a desfavoritar.
 * @returns Estado do favorito e a contagem atualizada.
 */
export async function removeFavorite(nftId: string): Promise<FavoriteMutationResponse> {
  const { data } = await httpClient.delete<FavoriteMutationResponse>(
    API_PATHS.favoriteByNftId(nftId),
  );
  return data;
}
