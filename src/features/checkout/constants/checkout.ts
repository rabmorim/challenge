import type { OrderDeclineReason, OrderStatus } from '@/features/checkout/types/order';
import type { WalletProvider } from '@/features/wallets/types/wallet';

/** Explicacao de cada motivo de recusa, pronta para exibicao. */
export const ORDER_DECLINE_LABELS: Record<OrderDeclineReason, string> = {
  PAYMENT_DECLINED: 'O pagamento foi recusado pela carteira.',
  WALLET_UNAVAILABLE: 'A carteira selecionada não respondeu.',
  EDITION_SOLD_OUT: 'A edição esgotou antes da confirmação.',
};

/** Estados terminais: nao mudam mais, nem por evento nem por refetch. */
export const TERMINAL_ORDER_STATUSES: readonly OrderStatus[] = ['confirmed', 'declined'] as const;

/**
 * Segmentos das query keys do pagamento.
 * Ficam aqui para que nenhuma chave nasca de string solta no meio de um hook.
 * O segmento das CARTEIRAS nao entra nesta lista: ele pertence a feature que as
 * cadastra (`wallets/constants/wallets.ts`), e importa-lo de la e o que impede
 * as duas telas de acabarem em entradas de cache diferentes.
 */
export const CHECKOUT_QUERY_SEGMENTS = {
  /** Cotacao da tela de pagamento (`POST /quotes`, com a rede escolhida). */
  quote: 'checkout-quote',
  /** Lista de pedidos do usuario (`GET /orders`) — retomada de pendente. */
  orders: 'orders',
  /** Estado de um pedido (`GET /orders/:id`). */
  order: 'order',
  /** Recibo de um pedido (`GET /orders/:id/receipt`). */
  receipt: 'receipt',
} as const;

/**
 * Ordem dos provedores no bloco "Carteira e rede".
 * O frame de 1440 desenha o primeiro como o selo de carteiras compativeis e o
 * de 414 o nomeia "WalletConnect" — e o mesmo provedor nas duas composicoes.
 */
export const WALLET_PROVIDER_ORDER: readonly WalletProvider[] = [
  'walletconnect',
  'metamask',
  'coinbase',
] as const;

/** Nome de exibicao de cada provedor. */
export const WALLET_PROVIDER_LABELS: Record<WalletProvider, string> = {
  walletconnect: 'WalletConnect',
  metamask: 'MetaMask',
  coinbase: 'Coinbase Wallet',
};

/** Inicial exibida no selo redondo de cada provedor no frame de 414. */
export const WALLET_PROVIDER_INITIALS: Record<WalletProvider, string> = {
  walletconnect: 'W',
  metamask: 'M',
  coinbase: 'C',
};

/** Caracteres visiveis no inicio e no fim de um endereco mascarado. */
export const ADDRESS_MASK = { prefix: 6, suffix: 4 } as const;

/** Tamanho maximo da observacao do colecionador (espelha a regra do servidor). */
export const MAX_COLLECTOR_NOTE_LENGTH = 280;

/** Lado (px) da miniatura das linhas do resumo e do recibo — medida do frame. */
export const CHECKOUT_THUMB_SIZE = 64;

/** Linhas desenhadas no esqueleto do resumo enquanto a cotacao chega. */
export const CHECKOUT_SKELETON_ROWS = 3;

/**
 * Arte do recibo exportada do Figma.
 * Entra como `img` (e nao como mascara de cor, como os glifos do header)
 * porque e uma ilustracao colorida, nao um icone que herda `currentColor`.
 */
export const THANK_YOU_ICON = { src: '/icons/thank-you.png', size: 80 } as const;

/** Etapas do pagamento no frame de 414. */
export const CHECKOUT_STEPS = {
  /** Formulario "Perfil do colecionador". */
  details: 'dados',
  /** Tela "Pagamento com carteira" do frame. */
  wallet: 'carteira',
} as const;
