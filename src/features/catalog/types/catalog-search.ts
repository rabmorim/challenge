import type { NftListParams, NftSortOption, NftTab } from '@/features/catalog/types/catalog-query';
import type { NftRarity } from '@/features/catalog/types/nft';
import type { EthAmount } from '@/types/api';
import type { NetworkId } from '@/types/network';

/**
 * Estado de URL do catálogo.
 *
 * As chaves são deliberadamente as mesmas de `NftListParams`: assim "a consulta
 * reflete os parâmetros enviados à API" deixa de ser convenção e vira
 * identidade — o objeto da URL é o corpo da requisição, sem tradução no meio.
 */
export interface CatalogSearch {
  /** Busca livre por nome, coleção ou criador. */
  search?: string;
  /** Ids de coleção selecionados na sidebar. */
  collections?: string[];
  networks?: NetworkId[];
  rarities?: NftRarity[];
  /** Faixa de preço em ETH (string decimal, nunca `number`). */
  priceMin?: EthAmount;
  priceMax?: EthAmount;
  /** Aba acima da grade; omitida da URL quando é a padrão. */
  tab?: NftTab;
  /** Ordenação; omitida da URL quando é a padrão. */
  sort?: NftSortOption;
  /** Página atual; omitida da URL quando é a primeira. */
  page?: number;
}

/**
 * Alteração pedida ao estado de URL.
 *
 * `undefined` em uma chave a **remove** da URL — é assim que um filtro é
 * desmarcado. O `undefined` é explícito no tipo porque o projeto roda com
 * `exactOptionalPropertyTypes`: "ausente" e "presente como undefined" são
 * coisas diferentes, e aqui a segunda é justamente o pedido de remoção.
 */
export type CatalogPatch = { [TKey in keyof CatalogSearch]?: CatalogSearch[TKey] | undefined };

/** Parâmetros efetivamente enviados à API (todos os campos resolvidos). */
export type CatalogListParams = NftListParams;

/** Chaves de lista do estado de URL — as que aceitam vários valores. */
export type CatalogListFilterKey = 'collections' | 'networks' | 'rarities';

/**
 * Interface do estado de URL exposta pelos componentes do catálogo.
 * Só setters nomeados: nenhum componente monta um objeto de busca na mão.
 */
export interface CatalogSearchApi {
  /** Estado atual, já validado pela rota. */
  search: CatalogSearch;
  /** Os mesmos parâmetros, na forma enviada à API. */
  params: CatalogListParams;
  /** `true` quando há filtro ou busca aplicados (habilita "limpar"). */
  hasFilters: boolean;
  setSearch: (term: string) => void;
  setTab: (tab: NftTab) => void;
  setSort: (sort: NftSortOption) => void;
  toggleCollection: (collectionId: string) => void;
  toggleNetwork: (network: NetworkId) => void;
  setPriceRange: (priceMin: EthAmount | undefined, priceMax: EthAmount | undefined) => void;
  goToPage: (page: number) => void;
  clearFilters: () => void;
}
