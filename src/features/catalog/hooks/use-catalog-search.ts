import { useNavigate, useSearch } from '@tanstack/react-router';
import { useCallback, useMemo } from 'react';

import {
  applyCatalogPatch,
  hasActiveFilters,
  toListParams,
  toggleFilterValue,
} from '@/features/catalog/lib/catalog-search';
import type { NftSortOption, NftTab } from '@/features/catalog/types/catalog-query';
import type {
  CatalogPatch,
  CatalogSearch,
  CatalogSearchApi,
} from '@/features/catalog/types/catalog-search';
import type { EthAmount } from '@/types/api';
import type { NetworkId } from '@/types/network';

/**
 * Lê e escreve o estado de URL do catálogo.
 *
 * Toda alteração passa por `applyCatalogPatch`, que é onde mora a regra do
 * reinício de paginação — nenhum controle da interface monta objeto de busca na
 * mão, então nenhum consegue esquecê-la.
 *
 * A reescrita descarta as chaves do catálogo de `previous` e devolve o estado
 * novo por inteiro: um filtro desmarcado precisa **sair** da URL, e manter a
 * chave com valor vazio deixaria `?collections=` pendurado no endereço. O que
 * não é do catálogo (o `?auth=` do painel de autenticação, que vive na rota
 * raiz) atravessa intacto em `rest`.
 *
 * @returns Estado atual, parâmetros da API e os setters tipados.
 */
export function useCatalogSearch(): CatalogSearchApi {
  const search = useSearch({ strict: false }) as CatalogSearch;
  const navigate = useNavigate();

  const update = useCallback(
    (patch: CatalogPatch, replace = false) => {
      void navigate({
        to: '.',
        search: ({
          search: _search,
          collections: _collections,
          networks: _networks,
          rarities: _rarities,
          priceMin: _priceMin,
          priceMax: _priceMax,
          tab: _tab,
          sort: _sort,
          page: _page,
          ...rest
        }) => ({ ...rest, ...applyCatalogPatch(search, patch) }),
        replace,
        resetScroll: false,
      });
    },
    [navigate, search],
  );

  const params = useMemo(() => toListParams(search), [search]);

  return useMemo(
    () => ({
      search,
      params,
      hasFilters: hasActiveFilters(search),

      setSearch: (term: string) => {
        // `replace` na digitação: cada tecla não pode virar um passo do histórico.
        update({ search: term.trim().length > 0 ? term : undefined }, true);
      },
      setTab: (tab: NftTab) => {
        update({ tab });
      },
      setSort: (sort: NftSortOption) => {
        update({ sort });
      },
      toggleCollection: (collectionId: string) => {
        update({ collections: toggleFilterValue(search.collections, collectionId) });
      },
      toggleNetwork: (network: NetworkId) => {
        update({ networks: toggleFilterValue(search.networks, network) });
      },
      setPriceRange: (priceMin: EthAmount | undefined, priceMax: EthAmount | undefined) => {
        update({ priceMin, priceMax });
      },
      goToPage: (page: number) => {
        update({ page });
      },
      clearFilters: () => {
        update({
          search: undefined,
          collections: undefined,
          networks: undefined,
          rarities: undefined,
          priceMin: undefined,
          priceMax: undefined,
        });
      },
    }),
    [params, search, update],
  );
}
