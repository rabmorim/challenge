import type { NftSummary } from '@/features/catalog/types/nft';

/**
 * Favoritos do usuario autenticado.
 * Traz os ids (para marcar os cards sem depender da pagina carregada) e os
 * resumos (para a tela de favoritos).
 */
export interface FavoritesResponse {
  nftIds: string[];
  items: NftSummary[];
}

/** Corpo da inclusao de favorito. */
export interface AddFavoriteRequest {
  nftId: string;
}

/** Resposta das mutations de favorito — base do update otimista com rollback. */
export interface FavoriteMutationResponse {
  nftId: string;
  favorited: boolean;
  /** Contagem apos a mutation, para o card nao ficar dessincronizado. */
  favoritesCount: number;
}
