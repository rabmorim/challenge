import type { ReactNode } from 'react';

import type { NftFacetOption, NftListResponse } from '@/features/catalog/types/catalog-query';
import type { CatalogSearchApi } from '@/features/catalog/types/catalog-search';
import type { FavoritesApi } from '@/features/catalog/types/favorites-state';
import type { NftSummary } from '@/features/catalog/types/nft';

/** Variantes visuais do botão de favoritar. */
export type FavoriteButtonVariant = 'overlay' | 'outline' | 'bare' | 'circle';

/** Props do botão de favoritar. */
export interface FavoriteButtonProps {
  nftId: string;
  /** Nome do NFT — entra no rótulo acessível, que não pode ser só "favoritar". */
  nftName: string;
  isFavorite: boolean;
  isPending: boolean;
  onToggle: (nftId: string) => void;
  variant?: FavoriteButtonVariant;
}

/** Props do card do catálogo. */
export interface NftCardProps {
  nft: NftSummary;
  isFavorite: boolean;
  isFavoritePending: boolean;
  onToggleFavorite: (nftId: string) => void;
}

/** Props da faixa de ações sobre a arte do card. */
export interface NftCardActionsProps {
  nft: NftSummary;
  /** Botão de favoritar, composto de fora para não duplicar o hook. */
  children: ReactNode;
}

/** Props da grade de resultados. */
export interface NftGridProps {
  items: NftSummary[];
  favorites: FavoritesApi;
  /** `true` enquanto os itens visíveis não correspondem aos filtros pedidos. */
  isRefreshing: boolean;
}

/** Props do bloco de catálogo completo (sidebar + resultados). */
export interface CatalogSectionProps {
  /** `true` na Início, onde a sidebar acompanha o card "NFT em destaque". */
  withFeatured?: boolean;
}

/** Props de um grupo de filtros por faceta. */
export interface FacetFilterProps {
  title: string;
  options: NftFacetOption[];
  selected: readonly string[];
  onToggle: (id: string) => void;
  /** `true` enquanto as contagens ainda não chegaram. */
  isPending: boolean;
}

/** Props do filtro de faixa de preço. */
export interface PriceFilterProps {
  /** Faixa completa do catálogo, base do slider. */
  range: NftListResponse['facets']['priceRange'] | null;
  selectedMin: string | undefined;
  selectedMax: string | undefined;
  onApply: (min: string, max: string) => void;
  isPending: boolean;
}

/** Props da paginação. */
export interface CatalogPaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

/** Props da barra de abas e ordenação. */
export interface CatalogToolbarProps {
  catalog: CatalogSearchApi;
}

/** Props comuns às duas composições do herói (celular e desktop). */
export interface HeroLayoutProps {
  highlights: NftSummary[];
  /** Destaque exibido; `null` enquanto a consulta não respondeu. */
  active: NftSummary | null;
  activeIndex: number;
  onSelect: (index: number) => void;
  isPending: boolean;
}

/** Props dos pontos do carrossel do herói. */
export interface HeroHighlightDotsProps {
  highlights: NftSummary[];
  activeIndex: number;
  onSelect: (index: number) => void;
  /** Classes da faixa — posição e vão mudam entre os dois frames. */
  className?: string;
  /** Classes de cada ponto: 7px no frame de 414, 8px no de 1440. */
  dotClassName?: string;
}

/** Props do card "NFT em destaque" da sidebar. */
export interface FeaturedNftProps {
  nft: NftSummary | null;
  isPending: boolean;
}

/** Props da sidebar de filtros. */
export interface CatalogSidebarProps {
  catalog: CatalogSearchApi;
  /** Facetas da resposta corrente; `null` enquanto a primeira não chegou. */
  facets: NftListResponse['facets'] | null;
  isPending: boolean;
}

/** Props do estado de resultado vazio. */
export interface CatalogEmptyProps {
  hasFilters: boolean;
  onClearFilters: () => void;
}

/** Props do estado de falha da consulta. */
export interface CatalogErrorProps {
  error: unknown;
  onRetry: () => void;
}
