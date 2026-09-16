import type { NftDetail } from '@/features/catalog/types/nft';
import type { Order, OrderReceipt } from '@/features/checkout/types/order';
import type { Quote } from '@/features/checkout/types/quote';
import type { Wallet } from '@/features/wallets/types/wallet';
import type { EthAmount, IsoDateTime, Quantity } from '@/types/api';

/**
 * Formato do estado do servidor simulado.
 * Cada colecao e uma lista simples: o store e pequeno o suficiente para que
 * varredura linear seja mais legivel (e mais facil de auditar) que indices.
 */

/** Usuario persistido. A senha nunca e guardada em claro (ver `db/password.ts`). */
export interface UserRecord {
  id: string;
  username: string;
  email: string;
  /** Derivacao da senha — suficiente para a simulacao, nao e criptografia. */
  passwordHash: string;
  displayName: string;
  bio: string;
  /** `null` quando a conta nao tem nome ENS. */
  ensName: string | null;
  /** Rotulo padrao sugerido no cadastro de carteiras. */
  walletLabel: string;
  /** `''` quando o colecionador removeu o avatar. */
  avatarUrl: string;
  createdAt: IsoDateTime;
}

/** Sessao emitida pelo login/cadastro. */
export interface SessionRecord {
  token: string;
  userId: string;
  issuedAt: IsoDateTime;
  expiresAt: IsoDateTime;
  /** Preenchido no logout — sessao revogada nao volta a valer. */
  revokedAt: IsoDateTime | null;
}

/** Colecao do catalogo (agrupa NFTs e alimenta o filtro da sidebar). */
export interface CollectionRecord {
  id: string;
  name: string;
  description: string;
  /**
   * Tamanho do acervo anunciado pela faceta da sidebar.
   * E o numero entre parenteses no frame — vitrine do acervo completo, nao a
   * contagem dos itens semeados (ver `fixtures/collections.ts`).
   */
  catalogSize: number;
  /** Endereco de contrato simulado, exibido no detalhe e no recibo. */
  contractAddress: string;
  /** Descricao do fundo da arte, usada como atributo do detalhe. */
  background: string;
}

/**
 * NFT persistido: o detalhe completo mais o sinal de "em alta".
 * `version` sobe a cada mudanca de preco/disponibilidade e e o que viaja no
 * evento `nft.updated`.
 */
export interface NftRecord extends NftDetail {
  /** Peso da aba "Em alta"; determinístico, definido nas fixtures. */
  trendingScore: number;
}

/** Item de carrinho persistido — o preco nao e copiado, vem sempre do NFT. */
export interface CartItemRecord {
  id: string;
  nftId: string;
  quantity: Quantity;
  addedAt: IsoDateTime;
}

/**
 * Carrinho de um dono. `ownerId` e o id do usuario autenticado ou a identidade
 * do visitante (`x-guest-id`) — e o que garante isolamento entre sessoes.
 */
export interface CartRecord {
  ownerId: string;
  items: CartItemRecord[];
  version: number;
  updatedAt: IsoDateTime;
}

/** Favorito de um usuario. */
export interface FavoriteRecord {
  userId: string;
  nftId: string;
  createdAt: IsoDateTime;
}

/** Cupom da simulacao: valido, expirado ou restrito a colecoes/subtotal. */
export interface CouponRecord {
  code: string;
  label: string;
  /** Percentual de desconto como string decimal, ex.: `"10"`. */
  percentOff: string;
  /** `null` quando o cupom nao expira. */
  expiresAt: IsoDateTime | null;
  /** Subtotal minimo exigido; `null` quando nao ha minimo. */
  minSubtotal: EthAmount | null;
  /** Restricao de colecoes; `null` quando vale para o catalogo inteiro. */
  collectionIds: string[] | null;
}

/** Cotacao persistida, amarrada ao dono que a pediu. */
export interface QuoteRecord extends Quote {
  ownerId: string;
}

/** Recibo persistido: snapshot imutavel, indexado pelo pedido. */
export interface ReceiptRecord extends OrderReceipt {
  orderId: string;
}

/**
 * Registro de idempotencia de pedido.
 * Mesma chave + mesma impressao do corpo devolve o mesmo pedido; mesma chave
 * com corpo diferente e conflito.
 */
export interface IdempotencyRecord {
  key: string;
  ownerId: string;
  /** Impressao estavel do corpo da requisicao. */
  fingerprint: string;
  orderId: string;
  createdAt: IsoDateTime;
}

/** Carteira persistida, sempre amarrada a um usuario. */
export interface WalletRecord extends Wallet {
  userId: string;
}

/** Estado completo do servidor simulado. */
export interface MockDatabase {
  users: UserRecord[];
  sessions: SessionRecord[];
  collections: CollectionRecord[];
  nfts: NftRecord[];
  carts: CartRecord[];
  favorites: FavoriteRecord[];
  coupons: CouponRecord[];
  quotes: QuoteRecord[];
  orders: Order[];
  receipts: ReceiptRecord[];
  idempotency: IdempotencyRecord[];
  wallets: WalletRecord[];
  /** Contadores para ids e referencias sequenciais determinísticas. */
  sequences: Record<string, number>;
}

/** Envelope gravado no `localStorage` para sobreviver ao refresh. */
export interface PersistedMockState {
  schemaVersion: number;
  /**
   * Impressao digital das fixtures que geraram este estado.
   * Divergiu, o estado salvo e de um acervo que nao existe mais e e descartado.
   */
  seedSignature: string;
  scenarioId: string;
  database: MockDatabase;
}
