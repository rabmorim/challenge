import type { NftRarity, NftSummary } from '@/features/catalog/types/nft';
import type { EthAmount, Paginated } from '@/types/api';
import type { NetworkId } from '@/types/network';

/** Ordenacoes aceitas pela listagem ("Ordenar por" no layout). */
export type NftSortOption = 'recent' | 'price-asc' | 'price-desc' | 'name-asc' | 'popular';

/** Abas acima do grid: todos, novos lancamentos e em alta. */
export type NftTab = 'all' | 'new' | 'trending';

/**
 * Parametros da listagem de NFTs. Sao os mesmos que compoem a URL
 * (TanStack Router) e os que vao para a API — sem traducao no meio.
 */
export interface NftListParams {
  /** Busca livre por nome, colecao ou criador. */
  search?: string;
  /** Ids de colecao; combinaveis entre si e com os outros filtros. */
  collections?: string[];
  networks?: NetworkId[];
  rarities?: NftRarity[];
  /** Faixa de preco em ETH (string decimal). */
  priceMin?: EthAmount;
  priceMax?: EthAmount;
  tab?: NftTab;
  sort?: NftSortOption;
  page?: number;
  pageSize?: number;
}

/** Opcao de filtro com contagem, como a sidebar do layout exibe. */
export interface NftFacetOption {
  id: string;
  label: string;
  count: number;
}

/**
 * Contagens e limites calculados pelo servidor para alimentar a sidebar.
 * Vem na resposta da listagem para que os filtros nao precisem de outra query.
 */
export interface NftListFacets {
  collections: NftFacetOption[];
  networks: NftFacetOption[];
  rarities: NftFacetOption[];
  /** Faixa de preco de todo o catalogo, base do slider. */
  priceRange: {
    min: EthAmount;
    max: EthAmount;
  };
}

/** Resposta da listagem: pagina + facetas + o que o servidor efetivamente aplicou. */
export interface NftListResponse extends Paginated<NftSummary> {
  facets: NftListFacets;
  /** Ordenacao aplicada — confirma ao cliente o que o servidor entendeu. */
  appliedSort: NftSortOption;
  appliedTab: NftTab;
}
