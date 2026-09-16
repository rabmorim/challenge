import type { EthAmount, IsoDateTime, Quantity, Versioned } from '@/types/api';
import type { NetworkId } from '@/types/network';

/** Raridade do NFT — vira o selo "RARO" do layout. */
export type NftRarity = 'common' | 'rare' | 'legendary';

/** Estado da edicao: quantas unidades existem e quantas ainda estao a venda. */
export interface NftEdition {
  /** Unidades cunhadas na edicao. */
  total: Quantity;
  /** Unidades ainda disponiveis para compra. */
  available: Quantity;
  /** Limite por pedido — o detalhe e o carrinho respeitam este teto. */
  maxPerOrder: Quantity;
}

/** Criador do NFT, exibido no card e no detalhe. */
export interface NftCreator {
  id: string;
  name: string;
  avatarUrl: string;
}

/**
 * NFT na forma resumida (card do catalogo, carrinho, pedido).
 * `version` acompanha o recurso para que eventos antigos de `nft.updated`
 * sejam descartados sem regredir o estado.
 */
export interface NftSummary extends Versioned {
  /** Slug estavel, aceito tambem na rota de detalhe. */
  slug: string;
  name: string;
  collectionId: string;
  /** Nome da colecao, ja resolvido para evitar outra requisicao. */
  collectionName: string;
  creator: NftCreator;
  network: NetworkId;
  price: EthAmount;
  /** Preco anterior, quando ha promocao (preco riscado no layout). */
  previousPrice: EthAmount | null;
  rarity: NftRarity;
  imageUrl: string;
  /** Texto alternativo da arte, obrigatorio por acessibilidade. */
  imageAlt: string;
  edition: NftEdition;
  listedAt: IsoDateTime;
  /** Total de favoritos — alimenta a ordenacao por popularidade. */
  favoritesCount: number;
}

/** Atributo do NFT exibido na tabela de propriedades do detalhe. */
export interface NftTrait {
  label: string;
  value: string;
}

/** Nota agregada das avaliacoes de colecionadores, exibida ao lado do preco. */
export interface NftRating {
  /** Media em string decimal com uma casa, ex.: `"4.8"`. */
  average: string;
  /** Quantidade de avaliacoes que compoem a media. */
  count: number;
}

/** Avaliacao deixada por um colecionador, listada na aba "Avaliacoes". */
export interface NftReview {
  id: string;
  author: string;
  /** Nota inteira de 1 a 5. */
  rating: number;
  comment: string;
  createdAt: IsoDateTime;
}

/** NFT completo, servido pela rota de detalhe. */
export interface NftDetail extends NftSummary {
  /** Resumo curto exibido em "Sobre este NFT", logo abaixo do preco. */
  description: string;
  /**
   * Texto longo da aba "Detalhes do NFT", com os paragrafos separados por
   * linha em branco (`\n\n`).
   */
  story: string;
  /** Galeria do detalhe; o primeiro item e sempre `imageUrl`. */
  gallery: string[];
  traits: NftTrait[];
  /** Endereco de contrato simulado, exibido como metadado. */
  contractAddress: string;
  tokenId: string;
  /** Nota agregada — o cabecalho do detalhe a exibe junto do preco. */
  rating: NftRating;
  /** Avaliacoes listadas na segunda aba do detalhe. */
  reviews: NftReview[];
}
