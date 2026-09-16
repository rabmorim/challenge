import type { RefObject } from 'react';

import type { CartItem } from '@/features/cart/types/cart';
import type { CollectorDetails, Order, OrderReceipt } from '@/features/checkout/types/order';
import type { Quote } from '@/features/checkout/types/quote';
import type { QuoteSummaryApi } from '@/features/checkout/types/quote-summary';
import type { Wallet, WalletProvider } from '@/features/wallets/types/wallet';
import type { AvailabilityConflict, Quantity } from '@/types/api';
import type { NormalizedHttpError } from '@/types/http';
import type { NetworkId } from '@/types/network';

/** Tipos de estado do pagamento — o que os hooks entregam a interface. */

/**
 * Estado do pedido do ponto de vista do cliente.
 *
 * `unknown` e o estado do timeout: o pedido pode existir no servidor e a
 * resposta se perdeu. Ele nao vira `pending` por otimismo — so depois de o
 * reenvio da mesma chave (ou a reconciliacao REST) dizer qual pedido e.
 */
export type OrderPhase = 'idle' | 'submitting' | 'unknown' | 'pending' | 'confirmed' | 'declined';

/** Origem do bloqueio da confirmacao. */
export type StaleQuoteSource = 'realtime' | 'conflict' | 'expired';

/**
 * Bloqueio por cotacao desatualizada.
 * Carrega o que mudou para a tela nao precisar de outra requisicao — sao os
 * `conflicts` do erro normalizado, ou o que o `nft.updated` trouxe.
 */
export interface StaleQuoteBlock {
  source: StaleQuoteSource;
  /** Mensagem do servidor, quando a origem foi um conflito. */
  message: string;
  conflicts: AvailabilityConflict[];
}

/** Registro persistido de uma tentativa de compra. */
export interface CheckoutAttemptRecord {
  /** Chave de idempotencia da tentativa. */
  key: string;
  /** Impressao digital do corpo que originou a chave. */
  fingerprint: string;
  /** Pedido criado por esta tentativa, quando ja conhecido. */
  orderId: string | null;
  createdAt: string;
}

/** Ciclo de vida da chave de idempotencia. */
export interface CheckoutAttemptApi {
  /**
   * Devolve a chave da tentativa correspondente a este corpo.
   * Mesma impressao digital reusa a chave; corpo diferente comeca outra
   * tentativa. A gravacao acontece ANTES de a requisicao sair, para que um
   * timeout nao deixe a chave de fora do disco.
   *
   * @param fingerprint - Impressao digital do corpo do pedido.
   * @returns Chave a enviar em `x-idempotency-key`.
   */
  resolveKey: (fingerprint: string) => string;
  /**
   * Registra o pedido criado pela tentativa corrente.
   *
   * @param orderId - Id do pedido devolvido pelo servidor.
   */
  rememberOrder: (orderId: string) => void;
  /** Encerra a tentativa (estado terminal ou saida da tela). */
  clear: () => void;
  /** Pedido da tentativa guardada, para retomada apos refresh. */
  storedOrderId: string | null;
  /** `true` quando ha uma tentativa gravada sem pedido conhecido. */
  hasOrphanAttempt: boolean;
}

/** Valores do formulario do colecionador, mais a rede e o provedor escolhidos. */
export interface CollectorFormValues extends CollectorDetails {
  network: NetworkId;
  walletProvider: WalletProvider | '';
}

/** Erros por campo do formulario. */
export type CollectorFormErrors = Partial<Record<keyof CollectorFormValues, string>>;

/** Estado e acoes do formulario do colecionador. */
export interface CollectorFormApi {
  values: CollectorFormValues;
  errors: CollectorFormErrors;
  /** `true` depois da primeira tentativa de envio (quando os erros aparecem). */
  isSubmitted: boolean;
  /**
   * Altera um campo do formulario.
   *
   * @param field - Campo alterado.
   * @param value - Novo valor.
   */
  setValue: <TField extends keyof CollectorFormValues>(
    field: TField,
    value: CollectorFormValues[TField],
  ) => void;
  /**
   * Valida tudo e marca o formulario como enviado.
   *
   * @returns Valores validos, ou `null` quando ha erro.
   */
  validate: () => CollectorFormValues | null;
  /**
   * Aplica os erros por campo devolvidos pela API.
   *
   * @param fieldErrors - Mapa `campo -> mensagem` do erro normalizado.
   */
  applyServerErrors: (fieldErrors: Record<string, string>) => void;
}

/** Estado da secao recolhivel do formulario no frame de 414. */
export interface CollectorDisclosureApi {
  /** Secao aberta. */
  isOpen: boolean;
  /**
   * Abre e fecha a secao.
   *
   * @param isOpen - Novo estado, vindo do `toggle` do `details`.
   */
  setIsOpen: (isOpen: boolean) => void;
  /** Painel revelado — por onde o foco encontra o primeiro campo invalido. */
  panelRef: RefObject<HTMLDivElement | null>;
  /**
   * Valida o formulario e revela a secao quando ha erro.
   *
   * @returns `true` quando o envio pode seguir.
   */
  ensureValid: () => boolean;
}

/**
 * Intencao de selecao de carteira.
 *
 * `auto` significa "ainda nao escolhi": a carteira sai da regra padrao (a
 * principal conectada). Guardar a INTENCAO, e nao a carteira resolvida, e o que
 * permite a lista chegar depois sem um efeito para corrigir a escolha.
 */
export type WalletSelection =
  | { kind: 'auto' }
  | { kind: 'wallet'; walletId: string }
  | { kind: 'provider'; provider: WalletProvider };

/** Leitura e selecao das carteiras cadastradas (recurso apenas lido aqui). */
export interface WalletSelectionApi {
  wallets: Wallet[];
  /** Carteira escolhida para pagar; `null` enquanto nao ha nenhuma. */
  selected: Wallet | null;
  /** Provedor marcado no bloco "Carteira e rede". */
  provider: WalletProvider | null;
  isPending: boolean;
  isError: boolean;
  error: NormalizedHttpError | null;
  /** Carteira com conexao em voo, para travar os controles dela. */
  pendingWalletId: string | null;
  /** Falha da ultima conexao simulada (inclui a recusa). */
  connectionError: NormalizedHttpError | null;
  /**
   * Escolhe a carteira que vai pagar.
   *
   * @param walletId - Id da carteira cadastrada.
   */
  select: (walletId: string) => void;
  /**
   * Escolhe um provedor; seleciona a carteira cadastrada dele, quando existe.
   *
   * @param provider - Provedor marcado no bloco.
   */
  selectProvider: (provider: WalletProvider) => void;
  /**
   * Simula a conexao da carteira. Pode ser recusada pela simulacao.
   *
   * @param wallet - Carteira a conectar.
   */
  connect: (wallet: Wallet) => void;
  /**
   * Simula a desconexao da carteira.
   *
   * @param wallet - Carteira a desconectar.
   */
  disconnect: (wallet: Wallet) => void;
  refetch: () => void;
}

/** Portao que impede finalizar com cotacao desatualizada. */
export interface CheckoutGateApi {
  /** Bloqueio corrente; `null` quando a confirmacao esta liberada. */
  block: StaleQuoteBlock | null;
  /** `true` enquanto a cotacao nova ainda esta a caminho. */
  isRefreshing: boolean;
  /**
   * Levanta o bloqueio a partir de uma falha do servidor.
   *
   * @param error - Erro normalizado da criacao do pedido.
   * @returns `true` quando o erro era de fato um conflito de cotacao.
   */
  blockFromError: (error: NormalizedHttpError) => boolean;
  /** Aceita os novos valores e libera a confirmacao. */
  acknowledge: () => void;
}

/** Opcoes do portao de cotacao. */
export interface CheckoutGateOptions {
  /** Linhas do carrinho em pagamento — a origem dos ids observados. */
  items: readonly CartItem[];
  /** Cotacao corrente; a validade dela entra no bloqueio. */
  quote: Quote | null;
  /** `true` enquanto uma nova cotacao esta a caminho. */
  isRefreshing: boolean;
  /**
   * Publica avisos na regiao viva da tela.
   *
   * @param message - Texto ja pronto para leitura em voz alta.
   */
  announce: (message: string) => void;
  /**
   * Revalida carrinho e cotacao quando o bloqueio sobe.
   * O portao decide QUANDO bloquear; quem sabe recarregar os dados e a tela.
   */
  onStale: () => void;
}

/** Acompanhamento do pedido: estado, recibo e as acoes de retomada. */
export interface OrderTrackingApi {
  phase: OrderPhase;
  /** Pedido corrente lido do REST; `null` antes de existir um. */
  order: Order | null;
  /** Recibo do pedido confirmado (snapshot imutavel do servidor). */
  receipt: OrderReceipt | null;
  isReceiptPending: boolean;
}

/** Opcoes de `useOrderSubmit`. */
export interface OrderSubmitOptions {
  /** Dono da compra — entra nas query keys e na tentativa persistida. */
  userId: string;
  /** Cotacao vigente; sem ela nao ha o que enviar. */
  quote: Quote | null;
  form: CollectorFormApi;
  wallets: WalletSelectionApi;
  gate: CheckoutGateApi;
  /**
   * Publica avisos na regiao viva da tela.
   *
   * @param message - Texto ja pronto para leitura em voz alta.
   */
  announce: (message: string) => void;
}

/** Estado completo do envio do pedido. */
export interface OrderSubmitApi {
  phase: OrderPhase;
  order: Order | null;
  receipt: OrderReceipt | null;
  isReceiptPending: boolean;
  /** `true` enquanto ha um envio em voo (o botao fica travado). */
  isSubmitting: boolean;
  /** Falha do envio que nao e conflito de cotacao nem erro de campo. */
  error: NormalizedHttpError | null;
  /** Envia o pedido (ou reenvia a mesma tentativa apos timeout). */
  submit: () => void;
  /** Recomeca depois de uma recusa: nova tentativa, nova chave. */
  retryAfterDecline: () => void;
  /** Fecha o recibo e encerra a tentativa. */
  dismissReceipt: () => void;
}

/** Estado inteiro da tela de pagamento, montado por `useCheckout`. */
export interface CheckoutScreenState {
  items: CartItem[];
  itemCount: Quantity;
  isCartPending: boolean;
  isCartEmpty: boolean;
  cartError: NormalizedHttpError | null;
  refetchCart: () => void;
  quote: QuoteSummaryApi;
  form: CollectorFormApi;
  wallets: WalletSelectionApi;
  gate: CheckoutGateApi;
  order: OrderSubmitApi;
  /** Mensagem corrente da regiao viva. */
  liveMessage: string;
  /** `true` quando o botao "Confirmar compra" pode ser acionado. */
  canSubmit: boolean;
}
