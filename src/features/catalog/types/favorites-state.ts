import type { FavoritesResponse } from '@/features/catalog/types/favorites';
import type { NftSummary } from '@/features/catalog/types/nft';

/**
 * Instantâneo guardado antes de um update otimista.
 * É o que `onError` devolve ao cache quando a mutation falha.
 */
export interface FavoriteToggleContext {
  previous: FavoritesResponse | null;
}

/** Interface de favoritos consumida pelos componentes. */
export interface FavoritesApi {
  /** Ids favoritados, em `Set` para o card consultar em tempo constante. */
  favoriteIds: ReadonlySet<string>;
  /** Resumos dos favoritos, para a tela de lista. */
  items: NftSummary[];
  isPending: boolean;
  isError: boolean;
  /** `false` para visitante — o botão leva ao painel em vez de mutar. */
  isAuthenticated: boolean;
  /** NFT com mutation em andamento, para desabilitar só aquele botão. */
  pendingNftId: string | null;
  /** Última mensagem publicada na região viva. */
  announcement: string;
  toggleFavorite: (nftId: string) => void;
  refetch: () => void;
}
