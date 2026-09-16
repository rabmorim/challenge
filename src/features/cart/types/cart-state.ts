import type { Cart, CartItem } from '@/features/cart/types/cart';
import type { Quantity } from '@/types/api';
import type { NormalizedHttpError } from '@/types/http';

/** Tipos de estado do carrinho — o que os hooks entregam a interface. */

/**
 * Entrada da assinatura que identifica uma cotacao do carrinho.
 * Ver `lib/cart-quote-input.ts`.
 */
export interface QuoteSignatureEntry {
  nftId: string;
  quantity: Quantity;
  /** Versao do NFT; muda a assinatura quando `nft.updated` chega. */
  nftVersion: number;
}

/** Leitura do carrinho, com os cinco estados nomeados. */
export interface CartState {
  /** Dono corrente (id do usuario ou `guest`) — o mesmo da query key. */
  owner: string;
  items: CartItem[];
  itemCount: Quantity;
  /** Primeiro carregamento: a tela mostra esqueleto. */
  isPending: boolean;
  /** Carregou e nao ha itens — vazio nao e erro. */
  isEmpty: boolean;
  isError: boolean;
  error: NormalizedHttpError | null;
  /** Revalidacao em segundo plano, com dados ja na tela. */
  isRefreshing: boolean;
  refetch: () => void;
}

/**
 * Instantâneo guardado antes de um update otimista.
 * O rollback devolve o carrinho inteiro, e não um campo: a mesma linha alimenta
 * a tabela, o resumo e o selo do cabeçalho, e os três precisam voltar juntos.
 */
export interface CartMutationContext {
  previous: Cart | null;
}

/** Variáveis da inclusão de item. */
export interface AddItemVariables {
  nftId: string;
  quantity: Quantity;
}

/** Variáveis da alteração de quantidade. */
export interface SetQuantityVariables {
  item: CartItem;
  /** Quantidade já aparada no teto da edição. */
  quantity: Quantity;
  /** `true` quando quem chamou vai anunciar o motivo por conta própria. */
  silent: boolean;
}

/** Variáveis da remoção de item. */
export interface RemoveItemVariables {
  item: CartItem;
}

/** Mutations do carrinho: incluir, alterar quantidade e remover. */
export interface CartMutationsApi {
  /**
   * Acrescenta unidades de um NFT ao carrinho.
   *
   * @param nftId - NFT a incluir.
   * @param quantity - Unidades a somar.
   */
  addItem: (nftId: string, quantity: Quantity) => void;
  /**
   * Define a quantidade de uma linha, aparada no teto da edicao.
   *
   * @param item - Linha alterada.
   * @param quantity - Quantidade pretendida.
   * @param options - `silent` cala o anuncio desta mutation, para quem chamou
   *   poder dizer o MOTIVO da mudanca em vez do genérico "quantidade alterada".
   */
  setQuantity: (item: CartItem, quantity: Quantity, options?: { silent?: boolean }) => void;
  /**
   * Remove uma linha do carrinho.
   *
   * @param item - Linha removida.
   */
  removeItem: (item: CartItem) => void;
  /** Linha com mutation em voo, para desabilitar os controles dela. */
  pendingItemId: string | null;
  /** Inclusao em voo — usada pelos botoes do catalogo e do detalhe. */
  isAdding: boolean;
}

/** Opcoes do tempo real do carrinho. */
export interface CartRealtimeOptions {
  /** Publica avisos na regiao viva da tela. */
  announce: (message: string) => void;
  /**
   * Chamado quando a disponibilidade cai abaixo da quantidade da linha.
   *
   * @param item - Linha afetada.
   * @param quantity - Quantidade ja aparada no novo teto.
   */
  onAvailabilityDrop: (item: CartItem, quantity: Quantity) => void;
}

/** Opções do gate de sessão de `useAddToCart`. */
export interface AddToCartOptions {
  /**
   * `true` exige sessão antes de incluir — é o botão de compra do detalhe.
   * O carrinho em si aceita visitante, então o padrão é `false`.
   */
  requireSession?: boolean;
}

/** Ação de incluir um NFT no carrinho, exposta ao catálogo e ao detalhe. */
export interface AddToCartApi {
  /**
   * Inclui unidades de um NFT no carrinho do dono corrente.
   *
   * @param nftId - NFT a incluir.
   * @param quantity - Unidades a somar.
   */
  addToCart: (nftId: string, quantity: Quantity) => void;
  isAdding: boolean;
}
