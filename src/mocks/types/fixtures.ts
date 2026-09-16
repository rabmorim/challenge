import type { NftRarity } from '@/features/catalog/types/nft';
import type { WalletProvider, WalletRole } from '@/features/wallets/types/wallet';
import type { EthAmount, IsoDateTime, Quantity } from '@/types/api';
import type { NetworkId } from '@/types/network';

/**
 * Formas compactas usadas apenas na semeadura.
 * Descrever o catalogo com estas especificacoes (e derivar o resto no builder)
 * mantem as fixtures legiveis e impede divergencia entre itens.
 */

/**
 * Arte disponivel em `public/nfts`.
 *
 * O Figma entrega quatro pecas e as reutiliza entre os nove NFTs desenhados —
 * por isso a chave descreve a ARTE, nao o item. Cada chave tem um arquivo
 * (`ARTWORK_FILES`), nomeado pelo slug do primeiro NFT que a usa no layout.
 */
export type ArtworkKey =
  /** Ape marrom de jaqueta varsity verde, oculos escuros e pingente esmeralda. */
  | 'emerald-varsity'
  /** Ape cinza de bucket hat e moletom violeta. */
  | 'violet-bucket'
  /** Ape escuro de blazer marfim e gola esmeralda. */
  | 'ivory-blazer'
  /** Ape dourado de headphones verdes e jaqueta creme. */
  | 'golden-headphones';

/** Especificacao de um NFT do catalogo semeado. */
export interface NftSpec {
  /** Slug estavel; tambem e o `id` do recurso. */
  slug: string;
  name: string;
  collectionId: string;
  creatorId: string;
  network: NetworkId;
  price: EthAmount;
  /** Preco anterior quando o item esta em promocao. */
  previousPrice: EthAmount | null;
  rarity: NftRarity;
  artwork: ArtworkKey;
  /** Unidades cunhadas na edicao. */
  editionTotal: Quantity;
  /** Unidades ainda disponiveis. */
  editionAvailable: Quantity;
  /** Limite por pedido. */
  maxPerOrder: Quantity;
  listedAt: IsoDateTime;
  favoritesCount: number;
  /** Peso da aba "Em alta". */
  trendingScore: number;
  /** Acessorio visivel na arte — vira um atributo no detalhe. */
  accessory: string;
  /**
   * Fundo da arte, quando a peca foge do fundo padrao da colecao
   * (`CollectionRecord.background`). Vira o segundo atributo do detalhe.
   */
  background?: string;
  /**
   * Nome da serie a que a peca pertence, quando ele difere do rotulo da
   * colecao usada no filtro. E o que a linha "Colecao" do detalhe exibe.
   */
  collectionLabel?: string;
  /**
   * Total de avaliacoes, quando a peca precisa do numero exato do frame.
   * Sem isto a contagem e derivada do slug por hash estavel.
   */
  reviewCount?: number;
}

/** Especificacao de uma carteira semeada. */
export interface WalletSpec {
  id: string;
  userId: string;
  label: string;
  provider: WalletProvider;
  role: WalletRole;
  address: string;
  /** Nome ENS da carteira, quando ela tem um. */
  ensName?: string;
  network: NetworkId;
  /** "Nome de exibicao" do frame de carteiras. */
  displayName: string;
  /** "Nome do perfil" do frame de carteiras. */
  profileName: string;
  /** "E-mail" vinculado a carteira. */
  email: string;
  /** "Codigo de indicacao". */
  referralCode: string;
  /** "ENS ou carteira secundaria (opcional)", quando declarada. */
  linkedReference?: string;
}

/** Especificacao de um usuario semeado (senha em claro so aqui, na semeadura). */
export interface UserSpec {
  id: string;
  username: string;
  email: string;
  /** Credencial ficticia documentada no README; e convertida em hash na semeadura. */
  password: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  createdAt: IsoDateTime;
  /** Nome ENS da conta, quando o colecionador tem um. */
  ensName?: string;
  /** Rotulo padrao sugerido no cadastro de carteiras ("Apelido da carteira"). */
  walletLabel: string;
  /** NFTs (por slug) que o usuario ja tem como favoritos. */
  favoriteNftSlugs: string[];
}
