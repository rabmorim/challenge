import type { NftListParams } from '@/features/catalog/types/catalog-query';

/** Quantidade minima de um item no carrinho — abaixo disso, remove-se o item. */
export const MIN_ITEM_QUANTITY = 1;

/**
 * Segmentos das query keys do carrinho.
 * Ficam aqui para que nenhuma chave nasca de string solta no meio de um hook.
 */
export const CART_QUERY_SEGMENTS = {
  /** Itens do carrinho (`GET /cart`). */
  cart: 'cart',
} as const;

/**
 * Dono do carrinho enquanto nao ha sessao.
 * O servidor simulado resolve o visitante pelo cabecalho `x-guest-id`; aqui o
 * valor serve apenas para manter a chave dentro do ramo privado do cache.
 */
export const GUEST_CART_OWNER = 'guest';

/** Lado (px) da miniatura da linha do carrinho — medida do frame de 1440. */
export const CART_THUMB_SIZE = 70;

/** Lado (px) da miniatura do card do carrinho — medida do frame de 414. */
export const CART_CARD_THUMB_SIZE = 100;

/** Cards visiveis por pagina no carrossel "Colecionadores tambem viram". */
export const ALSO_VIEWED_PAGE_SIZE = 5;

/**
 * Parametros da consulta que alimenta "Colecionadores tambem viram".
 *
 * Os mais favoritados, numa pagina folgada: os itens que ja estao no carrinho
 * saem da lista antes de ela ser paginada, e o frame desenha tres bolinhas —
 * sem folga, remover um item do carrinho encolheria o carrossel.
 * Constante para que a query key seja estavel entre renders.
 */
export const ALSO_VIEWED_PARAMS = {
  tab: 'all',
  sort: 'popular',
  page: 1,
  pageSize: 18,
} as const satisfies NftListParams;

/** Linhas desenhadas no esqueleto dos itens — a media do carrinho do frame. */
export const CART_SKELETON_ROWS = 3;

/** Linhas de valor do resumo: subtotal, desconto, taxa e total. */
export const CART_SUMMARY_SKELETON_ROWS = 4;

/** Colunas da tabela do frame de 1440: NFTs, preco, edicoes, total e a lixeira. */
export const CART_TABLE_COLUMNS = 5;
