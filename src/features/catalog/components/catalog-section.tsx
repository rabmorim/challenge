import { useId } from 'react';

import { CatalogEmpty, CatalogError } from '@/features/catalog/components/catalog-feedback';
import { CatalogPagination } from '@/features/catalog/components/catalog-pagination';
import { CatalogSidebar } from '@/features/catalog/components/catalog-sidebar';
import { CatalogToolbar } from '@/features/catalog/components/catalog-toolbar';
import { FeaturedNft } from '@/features/catalog/components/featured-nft';
import { NftGrid } from '@/features/catalog/components/nft-grid';
import { NftGridSkeleton } from '@/features/catalog/components/nft-grid-skeleton';
import { CATALOG_COPY } from '@/features/catalog/constants/catalog-copy';
import { FIRST_PAGE } from '@/features/catalog/constants/catalog';
import { useCatalogSearch } from '@/features/catalog/hooks/use-catalog-search';
import { useFavorites } from '@/features/catalog/hooks/use-favorites';
import { useFeaturedNft } from '@/features/catalog/hooks/use-featured-nft';
import { useNftList } from '@/features/catalog/hooks/use-nft-list';
import { useNftRealtime } from '@/features/catalog/hooks/use-nft-realtime';
import type { CatalogSectionProps } from '@/features/catalog/types/catalog-components';

/**
 * Bloco de catálogo: sidebar de filtros + abas, grade e paginação.
 *
 * É o mesmo componente na Início e no Mercado — o estado vive na URL, então as
 * duas rotas compartilham comportamento sem compartilhar estado local. O
 * `nft.updated` é assinado aqui: preço e disponibilidade mudam na grade
 * enquanto ela está aberta, sem refetch.
 *
 * Os cinco estados da consulta aparecem na ordem em que o enunciado §4 os pede:
 * carregando (esqueleto), erro (com nova tentativa), vazio, sucesso e
 * atualização em segundo plano (grade anterior marcada com `aria-busy`).
 *
 * @param props - `withFeatured` acrescenta o card "NFT em destaque" (Início).
 */
export function CatalogSection({ withFeatured = false }: CatalogSectionProps) {
  const headingId = useId();
  const catalog = useCatalogSearch();
  const list = useNftList(catalog.params);
  const favorites = useFavorites();
  const featured = useFeaturedNft();

  useNftRealtime();

  const page = list.data?.page ?? catalog.params.page ?? FIRST_PAGE;
  const totalPages = list.data?.totalPages ?? 1;

  return (
    <section
      aria-labelledby={headingId}
      className="grid gap-4 lg:grid-cols-[310px_minmax(0,1fr)] lg:gap-12"
    >
      {/* O frame nao desenha um titulo aqui, mas a secao precisa de um nome e a
          ordem dos titulos precisa fechar (h1 -> h2 -> h3 da sidebar). */}
      <h2 className="sr-only" id={headingId}>
        {CATALOG_COPY.sectionLabel}
      </h2>

      {/* Em telas estreitas os filtros ficam atrás do botão que acompanha a
          busca no topo da tela (`CatalogSearchBar`); a partir de `lg` eles
          voltam a ser a coluna do frame de 1440. */}
      <div className="hidden flex-col gap-6 lg:flex">
        <CatalogSidebar
          catalog={catalog}
          facets={list.data?.facets ?? null}
          isPending={list.isPending}
        />
        {withFeatured && <FeaturedNft nft={featured.nft} isPending={featured.isPending} />}
      </div>

      <div className="flex min-w-0 flex-col gap-3 lg:gap-8">
        <CatalogToolbar catalog={catalog} />

        {/* Região viva: quem usa leitor de tela recebe o resultado da consulta
            sem precisar varrer a grade de novo a cada filtro. */}
        <output className="sr-only" aria-live="polite">
          {list.isRefreshing
            ? CATALOG_COPY.refreshing
            : CATALOG_COPY.resultsSummary(list.data?.total ?? 0, page, totalPages)}
        </output>

        {list.isPending && <NftGridSkeleton />}

        {!list.isPending && list.isError && (
          <CatalogError error={list.error} onRetry={list.refetch} />
        )}

        {!list.isPending && !list.isError && list.isEmpty && (
          <CatalogEmpty hasFilters={catalog.hasFilters} onClearFilters={catalog.clearFilters} />
        )}

        {!list.isPending && !list.isError && !list.isEmpty && (
          <>
            <NftGrid
              items={list.items}
              favorites={favorites}
              isRefreshing={list.isRefreshing || list.isStale}
            />
            <CatalogPagination page={page} totalPages={totalPages} onChange={catalog.goToPage} />
          </>
        )}
      </div>
    </section>
  );
}
