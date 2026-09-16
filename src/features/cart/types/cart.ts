import type { NftEdition } from '@/features/catalog/types/nft';
import type { EthAmount, IsoDateTime, Quantity, Versioned } from '@/types/api';
import type { NetworkId } from '@/types/network';

/**
 * Item do carrinho: um NFT, a edicao dele e a quantidade pedida.
 *
 * O que o servidor PERSISTE e so `nftId` + `quantity` (ver `mocks/db/cart.ts`);
 * a `edition`, o preco e os dados de exibicao sao lidos do catalogo a cada
 * resposta. E o que faz uma mudanca de preco ou de disponibilidade aparecer no
 * carrinho sem sincronizacao extra — e o que impede a linha de "congelar" um
 * preco que a cotacao vai desmentir.
 *
 * `nftVersion` acompanha a linha para que `nft.updated` antigo ou duplicado
 * seja descartado sem regredir um estado mais novo.
 */
export interface CartItem {
  /** Id do item no carrinho (nao e o id do NFT). */
  id: string;
  nftId: string;
  slug: string;
  name: string;
  /** Numero do token exibido na tabela ("ID do token: #0042"). */
  tokenId: string;
  imageUrl: string;
  imageAlt: string;
  network: NetworkId;
  /** Preco unitario no momento da leitura, vindo do catalogo. */
  unitPrice: EthAmount;
  quantity: Quantity;
  /** `unitPrice * quantity`, calculado pelo servidor. */
  lineTotal: EthAmount;
  /**
   * Estado da edicao agora: tiragem (rotulo "Edicao: 1/50"), unidades
   * disponiveis e limite por pedido — o teto da linha sai dos dois ultimos.
   */
  edition: NftEdition;
  /** Versao do NFT que originou esta linha (ver `nft.updated`). */
  nftVersion: number;
  addedAt: IsoDateTime;
}

/**
 * Carrinho do dono corrente. `version` sobe a cada alteracao para que a
 * interface descarte respostas fora de ordem.
 */
export interface Cart extends Versioned {
  items: CartItem[];
  /** Soma das quantidades — badge do header. */
  itemCount: Quantity;
  /**
   * Soma das linhas, calculada pelo servidor.
   * E referencia interna do recurso, nao o subtotal do resumo: o resumo da
   * tela vem sempre da cotacao (`POST /quotes`).
   */
  subtotal: EthAmount;
  updatedAt: IsoDateTime;
}

/** Corpo da inclusao de item. */
export interface AddCartItemRequest {
  nftId: string;
  quantity: Quantity;
}

/** Corpo da alteracao de quantidade. */
export interface UpdateCartItemRequest {
  quantity: Quantity;
}
