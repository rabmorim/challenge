import type { AppliedCoupon, QuoteItemInput } from '@/features/checkout/types/quote';
import type { EthAmount, IsoDateTime, Quantity, Versioned } from '@/types/api';
import type { NetworkId } from '@/types/network';

/** Estados de um pedido. `confirmed` e `declined` sao terminais. */
export type OrderStatus = 'pending' | 'confirmed' | 'declined';

/** Motivo da recusa, quando o pagamento simulado nao passa. */
export type OrderDeclineReason = 'PAYMENT_DECLINED' | 'WALLET_UNAVAILABLE' | 'EDITION_SOLD_OUT';

/**
 * Dados do colecionador coletados na tela de pagamento.
 *
 * Os campos sao exatamente os do frame `design/Pagamento.png` — nem um a mais.
 * `network` e `walletId` NAO estao aqui de proposito: apesar de os seletores
 * "Rede" e "Tipo de carteira" ficarem na mesma coluna do layout, eles definem
 * o pedido (taxa de rede e carteira usada), e duplica-los aqui criaria duas
 * fontes de verdade para o mesmo dado.
 */
export interface CollectorDetails {
  /** "Nome de exibicao" — como o colecionador aparece no marketplace. */
  displayName: string;
  /** "Nome de usuario" — o @ da conta. */
  username: string;
  /** "Nome do perfil" — titulo do perfil publico. */
  profileName: string;
  email: string;
  /** "Endereco da carteira" (`0x` + 40 hexadecimais). */
  walletAddress: string;
  /** "ENS ou carteira secundaria (opcional)"; `null` quando em branco. */
  secondaryWallet: string | null;
  /** "Codigo de indicacao". */
  referralCode: string;
  /** "Nome ENS" — o dominio escolhido no seletor, ex.: `.eth`. */
  ensDomain: string;
  /** "Usar outra carteira?" — o radio do frame. */
  usesAlternateWallet: boolean;
  /** "Observacao do colecionador (opcional)"; `null` quando em branco. */
  note: string | null;
}

/** Item do pedido — snapshot imutavel do que foi comprado. */
export interface OrderItem {
  nftId: string;
  slug: string;
  name: string;
  /** Numero do token exibido no recibo ("ID do token: #0042"). */
  tokenId: string;
  imageUrl: string;
  imageAlt: string;
  unitPrice: EthAmount;
  quantity: Quantity;
  lineTotal: EthAmount;
}

/** Totais do pedido, congelados no momento da criacao. */
export interface OrderTotals {
  subtotal: EthAmount;
  discount: EthAmount;
  networkFee: EthAmount;
  total: EthAmount;
}

/** Pedido. `version` permite descartar `order.updated` fora de ordem. */
export interface Order extends Versioned {
  /** Referencia legivel exibida na confirmacao, ex.: `KUR-2F4A19`. */
  reference: string;
  status: OrderStatus;
  /** Dono do pedido — impede aplicar evento de outra sessao. */
  userId: string;
  items: OrderItem[];
  totals: OrderTotals;
  coupon: AppliedCoupon | null;
  network: NetworkId;
  walletId: string;
  /** Endereco usado no pagamento, ja mascarado pelo servidor. */
  walletAddress: string;
  collector: CollectorDetails;
  /** Hash simulado, disponivel apenas quando confirmado. */
  transactionHash: string | null;
  /** Link simulado de exploracao, disponivel apenas quando confirmado. */
  explorerUrl: string | null;
  /** Preenchido apenas quando `status` e `declined`. */
  declineReason: OrderDeclineReason | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

/**
 * Corpo da criacao de pedido. Reenvia a cotacao (`quoteId` + assinatura) para
 * que o servidor revalide preco, disponibilidade, cupom e taxas antes de aceitar.
 */
export interface CreateOrderRequest {
  quoteId: string;
  pricingSignature: string;
  items: QuoteItemInput[];
  couponCode: string | null;
  network: NetworkId;
  walletId: string;
  collector: CollectorDetails;
}

/**
 * Recibo: snapshot imutavel do pedido.
 * Alteracoes posteriores no catalogo nao mudam nada aqui.
 */
export interface OrderReceipt {
  order: Order;
  issuedAt: IsoDateTime;
  /** Cenario de mocks vigente na emissao — util para depurar a simulacao. */
  scenario: string;
}

/** Lista de pedidos do usuario autenticado, do mais recente para o mais antigo. */
export interface OrdersListResponse {
  items: Order[];
}
