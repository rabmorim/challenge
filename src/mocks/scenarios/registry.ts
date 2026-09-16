import { SESSION_TTL_MS } from '@/mocks/constants';
import type {
  AccountBehavior,
  CatalogBehavior,
  CheckoutBehavior,
  FavoritesBehavior,
  NetworkBehavior,
  ScenarioConfig,
  ScenarioId,
  SessionBehavior,
  WalletBehavior,
} from '@/mocks/types/scenario';

/**
 * Registro dos cenarios da simulacao.
 *
 * Um cenario e so configuracao: os handlers leem estes valores. Isso evita
 * caminho de negocio alternativo espalhado pelos handlers e mantem cada
 * situacao do enunciado §6 reproduzivel por um unico id.
 */

/** Rede saudavel: latencia curta e nenhuma falha. */
const HEALTHY_NETWORK: NetworkBehavior = {
  latency: { minMs: 60, maxMs: 180 },
  jitter: false,
  failure: 'none',
  failFirstRequests: 0,
};

/** Catalogo com resultados. */
const FULL_CATALOG: CatalogBehavior = { empty: false };

/** Favoritos que aceitam as mutations. */
const HEALTHY_FAVORITES: FavoritesBehavior = { failMutations: false };

/** Sessao normal, com TTL padrao. */
const HEALTHY_SESSION: SessionBehavior = { expireImmediately: false, ttlMs: SESSION_TTL_MS };

/** Cadastro sem conflito forcado. */
const HEALTHY_ACCOUNT: AccountBehavior = { forceSignUpConflict: false };

/** Carteira que aceita a conexao simulada. */
const HEALTHY_WALLET: WalletBehavior = { refuseConnection: false };

/** Checkout que confirma o pagamento pouco depois de criar o pedido. */
const HEALTHY_CHECKOUT: CheckoutBehavior = {
  priceDriftAfterQuote: false,
  soldOutAfterQuote: false,
  timeoutAfterOrderCreated: false,
  payment: 'confirm',
  paymentDelayMs: 900,
};

/**
 * Monta um cenario a partir do cenario saudavel, sobrescrevendo apenas o que
 * muda. Cada bloco e substituido por inteiro (nao ha merge profundo), o que
 * mantem a definicao de cada cenario legivel de cima a baixo.
 *
 * @param id - Id do cenario.
 * @param label - Nome curto exibido no seletor.
 * @param description - O que o cenario exercita.
 * @param overrides - Blocos de comportamento que mudam.
 * @returns Cenario completo.
 */
function defineScenario(
  id: ScenarioId,
  label: string,
  description: string,
  overrides: Partial<Omit<ScenarioConfig, 'id' | 'label' | 'description'>> = {},
): ScenarioConfig {
  return {
    id,
    label,
    description,
    network: overrides.network ?? HEALTHY_NETWORK,
    catalog: overrides.catalog ?? FULL_CATALOG,
    favorites: overrides.favorites ?? HEALTHY_FAVORITES,
    session: overrides.session ?? HEALTHY_SESSION,
    account: overrides.account ?? HEALTHY_ACCOUNT,
    wallet: overrides.wallet ?? HEALTHY_WALLET,
    checkout: overrides.checkout ?? HEALTHY_CHECKOUT,
  };
}

/** Cenarios disponiveis, indexados pelo id. */
export const SCENARIOS: Record<ScenarioId, ScenarioConfig> = {
  default: defineScenario(
    'default',
    'Padrao',
    'Tudo saudavel: catalogo completo, latencia curta e pagamento confirmado.',
  ),
  empty: defineScenario(
    'empty',
    'Catalogo vazio',
    'Listagem sem resultados, para o estado vazio do grid e dos filtros.',
    { catalog: { empty: true } },
  ),
  slow: defineScenario(
    'slow',
    'Rede lenta',
    'Latencia alta e constante: exercita skeletons com shimmer e feedback de carregamento.',
    {
      network: { latency: { minMs: 1200, maxMs: 2600 }, jitter: false, failure: 'none', failFirstRequests: 0 },
    },
  ),
  'out-of-order': defineScenario(
    'out-of-order',
    'Respostas fora de ordem',
    'Latencia sorteada por requisicao (semente fixa): respostas chegam fora de ordem e as obsoletas precisam ser descartadas.',
    {
      network: { latency: { minMs: 120, maxMs: 1800 }, jitter: true, failure: 'none', failFirstRequests: 0 },
    },
  ),
  flaky: defineScenario(
    'flaky',
    'Falha intermitente',
    'As duas primeiras requisicoes falham com 503 e as seguintes passam: exercita retry e recuperacao.',
    {
      network: { latency: { minMs: 60, maxMs: 180 }, jitter: false, failure: 'flaky', failFirstRequests: 2 },
    },
  ),
  offline: defineScenario(
    'offline',
    'Sem conexao',
    'Toda requisicao falha antes de chegar ao servidor (erro de rede, sem status).',
    {
      network: { latency: { minMs: 0, maxMs: 0 }, jitter: false, failure: 'offline', failFirstRequests: 0 },
    },
  ),
  'server-error': defineScenario(
    'server-error',
    'Erro do servidor',
    'Toda requisicao responde 500: exercita o estado de erro e o retry das queries.',
    {
      network: { latency: { minMs: 60, maxMs: 180 }, jitter: false, failure: 'server-error', failFirstRequests: 0 },
    },
  ),
  'session-expired': defineScenario(
    'session-expired',
    'Sessao expirada',
    'O login devolve uma sessao ja expirada: os recursos protegidos respondem 401 e o app precisa retomar o fluxo.',
    { session: { expireImmediately: true, ttlMs: 0 } },
  ),
  'signup-conflict': defineScenario(
    'signup-conflict',
    'Conflito de cadastro',
    'Qualquer cadastro responde 409, mesmo com e-mail inedito.',
    { account: { forceSignUpConflict: true } },
  ),
  'favorite-error': defineScenario(
    'favorite-error',
    'Falha ao favoritar',
    'A leitura de favoritos funciona, mas incluir e remover responde 503: exercita o update otimista e o rollback.',
    { favorites: { failMutations: true } },
  ),
  'price-changed': defineScenario(
    'price-changed',
    'Preco alterado na compra',
    'O preco do primeiro item muda logo depois da cotacao: o pedido e recusado com conflito e a interface exige nova confirmacao.',
    { checkout: { ...HEALTHY_CHECKOUT, priceDriftAfterQuote: true } },
  ),
  'sold-out': defineScenario(
    'sold-out',
    'Edicao esgotada na compra',
    'A edicao do primeiro item esgota depois da cotacao: conflito de disponibilidade no envio do pedido.',
    { checkout: { ...HEALTHY_CHECKOUT, soldOutAfterQuote: true } },
  ),
  'order-timeout': defineScenario(
    'order-timeout',
    'Timeout apos criar o pedido',
    'O pedido e criado, mas a resposta nao chega em tempo: reenviar a mesma chave de idempotencia recupera o mesmo pedido.',
    { checkout: { ...HEALTHY_CHECKOUT, timeoutAfterOrderCreated: true } },
  ),
  'payment-declined': defineScenario(
    'payment-declined',
    'Pagamento recusado',
    'O pedido nasce pendente e o evento `order.updated` o recusa.',
    { checkout: { ...HEALTHY_CHECKOUT, payment: 'decline' } },
  ),
  'payment-manual': defineScenario(
    'payment-manual',
    'Pagamento pendente (manual)',
    'O pedido fica pendente ate um evento ser disparado pelo endpoint de controle: usado para desconexao e retomada.',
    { checkout: { ...HEALTHY_CHECKOUT, payment: 'manual' } },
  ),
  'wallet-refused': defineScenario(
    'wallet-refused',
    'Conexao de carteira recusada',
    'Conectar a carteira e negado, como quando o usuario recusa o pedido na extensao: a carteira fica recusada e o pedido com ela nao passa.',
    { wallet: { refuseConnection: true } },
  ),
};

/** Ids na ordem em que aparecem na documentacao e no seletor. */
export const SCENARIO_IDS = Object.keys(SCENARIOS) as ScenarioId[];

/**
 * Valida um id vindo de env, URL ou requisicao de controle.
 *
 * @param value - Valor de origem desconhecida.
 * @returns `true` quando o valor e um cenario conhecido.
 */
export function isScenarioId(value: unknown): value is ScenarioId {
  return typeof value === 'string' && value in SCENARIOS;
}
