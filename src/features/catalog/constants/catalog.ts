import type { NftRarity } from '@/features/catalog/types/nft';
import type { NftListParams, NftSortOption, NftTab } from '@/features/catalog/types/catalog-query';

/** Tamanho de pagina do grid (3 colunas x 3 linhas no layout desktop). */
export const DEFAULT_PAGE_SIZE = 9;

/** Teto de itens por pagina aceito pela API — protege contra `pageSize` absurdo. */
export const MAX_PAGE_SIZE = 48;

/** Primeira pagina, usada como padrao e no reinicio ao trocar de filtro. */
export const FIRST_PAGE = 1;

/** Ordenacao padrao ("Listados recentemente" no layout). */
export const DEFAULT_SORT: NftSortOption = 'recent';

/** Aba padrao ("Todos os NFTs"). */
export const DEFAULT_TAB: NftTab = 'all';

/** Ordem e rotulo das opcoes de ordenacao. */
export const SORT_OPTION_LABELS: Record<NftSortOption, string> = {
  recent: 'Listados recentemente',
  'price-asc': 'Menor preço',
  'price-desc': 'Maior preço',
  'name-asc': 'Nome (A-Z)',
  popular: 'Mais favoritados',
};

/** Rotulo das abas acima do grid. */
export const TAB_LABELS: Record<NftTab, string> = {
  all: 'Todos os NFTs',
  new: 'Novos lançamentos',
  trending: 'Em alta',
};

/** Rotulo de raridade — o selo "RARO" do layout vem daqui. */
export const RARITY_LABELS: Record<NftRarity, string> = {
  common: 'Comum',
  rare: 'Raro',
  legendary: 'Lendário',
};

/** Ordem canonica das raridades nos filtros. */
export const RARITY_IDS: readonly NftRarity[] = ['common', 'rare', 'legendary'] as const;

/**
 * Segmentos das query keys do catálogo.
 * Ficam aqui para que nenhuma chave nasça de string solta no meio de um hook.
 */
export const CATALOG_QUERY_SEGMENTS = {
  nfts: 'nfts',
  list: 'list',
  detail: 'detail',
  favorites: 'favorites',
} as const;

/** Atraso (ms) entre a digitação e a atualização da URL de busca. */
export const SEARCH_DEBOUNCE_MS = 350;

/** Quantidade de cards exibidos no carrossel "Mais desta coleção". */
export const RELATED_ITEMS_LIMIT = 5;

/**
 * Tamanho de página da consulta que alimenta os chips de edição e a seção
 * "Mais desta coleção" — uma coleção inteira cabe nesta página.
 */
export const RELATED_PAGE_SIZE = 12;

/** Lado (px) da arte no card do catálogo — medida do frame de 1440. */
export const CARD_IMAGE_SIZE = 250;

/** Quantidade de páginas numeradas exibidas na paginação antes das reticências. */
export const PAGINATION_WINDOW = 4;

/** Passo (ETH) do slider de faixa de preço. */
export const PRICE_SLIDER_STEP = 0.01;

/**
 * Parâmetros do card "NFT em destaque": os itens de "Em alta", de onde sai o
 * primeiro que está em promoção. Constante para que a query key seja estável
 * entre renders.
 */
export const FEATURED_NFT_PARAMS = {
  tab: 'trending',
  sort: 'recent',
  page: FIRST_PAGE,
  pageSize: 8,
} as const satisfies NftListParams;

/**
 * Parâmetros usados só para ler as facetas (rodapé).
 * Uma página mínima: o interesse é a lista de coleções, não os itens.
 */
export const FOOTER_COLLECTIONS_PARAMS = {
  tab: DEFAULT_TAB,
  sort: DEFAULT_SORT,
  page: FIRST_PAGE,
  pageSize: 1,
} as const satisfies NftListParams;

/** Lado (px) da arte do herói — medida do frame de 1440 do Figma. */
export const HERO_IMAGE_SIZE = 450;

/** Lado (px) da arte do herói — medida do frame de 414 do Figma. */
export const HERO_MOBILE_IMAGE_SIZE = 138;

/** Quantidade de destaques percorridos pelos pontos do herói. */
export const HERO_HIGHLIGHTS_COUNT = 3;

/** Parâmetros dos destaques do herói: os primeiros itens de "Em alta". */
export const HERO_HIGHLIGHTS_PARAMS = {
  tab: 'trending',
  sort: 'recent',
  page: FIRST_PAGE,
  pageSize: HERO_HIGHLIGHTS_COUNT,
} as const satisfies NftListParams;
