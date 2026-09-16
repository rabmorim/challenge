/**
 * Tipos do sistema de cenarios da simulacao.
 * Um cenario e apenas configuracao: os handlers leem estes valores e mudam de
 * comportamento sem duplicar caminho de negocio.
 */

/** Cenarios disponiveis. Selecionaveis por env, URL ou endpoint de controle. */
export type ScenarioId =
  | 'default'
  | 'empty'
  | 'slow'
  | 'out-of-order'
  | 'flaky'
  | 'offline'
  | 'server-error'
  | 'session-expired'
  | 'signup-conflict'
  | 'favorite-error'
  | 'price-changed'
  | 'sold-out'
  | 'order-timeout'
  | 'payment-declined'
  | 'payment-manual'
  | 'wallet-refused';

/** Faixa de latencia aplicada as respostas. */
export interface LatencyProfile {
  minMs: number;
  maxMs: number;
}

/** Tipo de falha forcada nas respostas. */
export type ForcedFailureKind = 'none' | 'offline' | 'server-error' | 'flaky';

/** Comportamento de rede do cenario. */
export interface NetworkBehavior {
  latency: LatencyProfile;
  /**
   * Sorteia a latencia por requisicao (com semente fixa). E o que produz
   * respostas fora de ordem de forma reproduzivel.
   */
  jitter: boolean;
  failure: ForcedFailureKind;
  /** Em `flaky`, quantas primeiras requisicoes falham antes de passar. */
  failFirstRequests: number;
}

/** Comportamento do catalogo. */
export interface CatalogBehavior {
  /** Devolve listagem vazia, para exercitar o estado "nenhum resultado". */
  empty: boolean;
}

/** Comportamento dos favoritos. */
export interface FavoritesBehavior {
  /**
   * Recusa as mutations de favorito com 503.
   * A leitura continua funcionando: e o que permite ver o update otimista ser
   * aplicado e depois desfeito pelo rollback, sem derrubar o catalogo junto.
   */
  failMutations: boolean;
}

/** Comportamento da sessao. */
export interface SessionBehavior {
  /** Emite a sessao ja expirada, para exercitar a expiracao na navegacao. */
  expireImmediately: boolean;
  /** Duracao da sessao quando ela nao nasce expirada. */
  ttlMs: number;
}

/** Comportamento do cadastro. */
export interface AccountBehavior {
  /** Recusa qualquer cadastro com conflito, mesmo com e-mail inedito. */
  forceSignUpConflict: boolean;
}

/** Comportamento da carteira simulada. */
export interface WalletBehavior {
  /**
   * A tentativa de conectar e negada, como quando o usuario recusa o pedido na
   * extensao: a carteira fica `refused` e o pedido com ela e bloqueado.
   */
  refuseConnection: boolean;
}

/** Como o pagamento simulado termina. */
export type PaymentOutcome = 'confirm' | 'decline' | 'manual';

/** Comportamento do checkout. */
export interface CheckoutBehavior {
  /** Muda o preco do primeiro item logo depois da cotacao. */
  priceDriftAfterQuote: boolean;
  /** Esgota a edicao do primeiro item logo depois da cotacao. */
  soldOutAfterQuote: boolean;
  /**
   * Cria o pedido e nao responde a tempo: o cliente recebe timeout e recupera
   * o mesmo pedido reenviando a chave de idempotencia.
   */
  timeoutAfterOrderCreated: boolean;
  /** `manual` deixa o pedido pendente ate um evento ser disparado a mao. */
  payment: PaymentOutcome;
  /** Atraso entre criar o pedido e resolve-lo por evento. */
  paymentDelayMs: number;
}

/** Cenario completo. */
export interface ScenarioConfig {
  id: ScenarioId;
  /** Nome curto para o seletor de cenarios. */
  label: string;
  /** O que o cenario exercita — aparece na documentacao e no seletor. */
  description: string;
  network: NetworkBehavior;
  catalog: CatalogBehavior;
  favorites: FavoritesBehavior;
  session: SessionBehavior;
  account: AccountBehavior;
  wallet: WalletBehavior;
  checkout: CheckoutBehavior;
}
