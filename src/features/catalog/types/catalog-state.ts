import type { NftListResponse } from '@/features/catalog/types/catalog-query';
import type { NftDetail, NftSummary } from '@/features/catalog/types/nft';

/**
 * Estado da listagem consumido pela interface.
 *
 * Os cinco estados do enunciado §4 aparecem nomeados de propósito — carregando,
 * vazio, erro, sucesso e atualização em segundo plano —, para que nenhuma tela
 * precise deduzi-los combinando flags do TanStack Query na mão.
 */
export interface NftListState {
  data: NftListResponse | null;
  items: NftListResponse['items'];
  /** Primeiro carregamento: não há nada em cache para mostrar. */
  isPending: boolean;
  isError: boolean;
  error: unknown;
  /** Requisição em andamento com dados já visíveis na tela. */
  isRefreshing: boolean;
  /** Os dados visíveis são de parâmetros anteriores aos pedidos. */
  isStale: boolean;
  isEmpty: boolean;
  refetch: () => void;
}

/** Estado do detalhe consumido pela tela de NFT. */
export interface NftDetailState {
  data: NftDetail | null;
  isPending: boolean;
  isError: boolean;
  /** `true` quando a falha é um 404 — a tela mostra "não encontrado". */
  isNotFound: boolean;
  error: unknown;
  isRefreshing: boolean;
  refetch: () => void;
}

/** Estado de um carrossel de NFTs paginado por bolinhas. */
export interface NftCarousel {
  /** Itens da página corrente. */
  visible: NftDetail[] | NftSummary[];
  /** Índice da página corrente, base 0. */
  page: number;
  /** Total de páginas; `1` quando os itens cabem numa só. */
  pageCount: number;
  goToPage: (page: number) => void;
}
