import type { EthAmount, IsoDateTime, Quantity, Versioned } from '@/types/api';
import type { NetworkId } from '@/types/network';

/** Item enviado para cotacao. */
export interface QuoteItemInput {
  nftId: string;
  quantity: Quantity;
}

/** Corpo da cotacao. O cupom e a rede sao opcionais. */
export interface QuoteRequest {
  items: QuoteItemInput[];
  /** Codigo digitado pelo usuario; `null` remove o cupom aplicado. */
  couponCode?: string | null;
  /** Rede escolhida no pagamento — define a taxa de rede. */
  network?: NetworkId;
}

/** Linha da cotacao, com os valores que o servidor calculou. */
export interface QuoteLine {
  nftId: string;
  name: string;
  imageUrl: string;
  unitPrice: EthAmount;
  quantity: Quantity;
  lineTotal: EthAmount;
  /** Unidades disponiveis no momento da cotacao. */
  available: Quantity;
  /** Versao do NFT cotado — comparada na criacao do pedido. */
  nftVersion: number;
}

/** Cupom efetivamente aplicado pelo servidor. */
export interface AppliedCoupon {
  code: string;
  label: string;
  /** Percentual de desconto como string decimal, ex.: `"10"`. */
  percentOff: string;
  /** Valor do desconto em ETH, calculado pelo servidor. */
  discount: EthAmount;
}

/**
 * Cotacao — unica fonte de verdade dos valores da compra.
 * O cliente nunca soma nada por conta propria: exibe o que vem daqui.
 */
export interface Quote extends Versioned {
  network: NetworkId;
  lines: QuoteLine[];
  subtotal: EthAmount;
  discount: EthAmount;
  networkFee: EthAmount;
  total: EthAmount;
  coupon: AppliedCoupon | null;
  /** Validade da cotacao; depois disso o pedido exige nova cotacao. */
  expiresAt: IsoDateTime;
  /**
   * Assinatura de precos e versoes dos itens cotados. O pedido a reenvia e o
   * servidor recusa (`PRICE_CHANGED`) se o catalogo mudou no meio do caminho.
   */
  pricingSignature: string;
  createdAt: IsoDateTime;
}
