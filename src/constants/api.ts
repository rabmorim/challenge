/**
 * Caminhos da API REST simulada. Todo consumo passa por aqui para que o
 * contrato de transporte fique versionado num unico lugar.
 *
 * `API_PATHS` e o que o cliente Axios usa (caminho concreto).
 * `API_PATTERNS` e a mesma rota no formato de padrao do MSW (`:param`), usada
 * so pelos handlers — as duas listas ficam lado a lado de proposito, para que
 * qualquer divergencia salte aos olhos na revisao.
 */
export const API_PATHS = {
  /** Sessao e conta. */
  signUp: '/auth/signup',
  login: '/auth/login',
  session: '/auth/session',
  logout: '/auth/logout',

  /** Catalogo. */
  nfts: '/nfts',
  /** Detalhe de um NFT por id ou slug. */
  nftById: (nftId: string) => `/nfts/${nftId}`,

  /** Favoritos do usuario autenticado. */
  favorites: '/favorites',
  favoriteByNftId: (nftId: string) => `/favorites/${nftId}`,

  /** Carrinho do dono corrente (usuario autenticado ou visitante). */
  cart: '/cart',
  cartItems: '/cart/items',
  cartItemById: (itemId: string) => `/cart/items/${itemId}`,

  /** Cotacao: o servidor simulado calcula descontos, taxas e total. */
  quotes: '/quotes',

  /** Pedidos. */
  orders: '/orders',
  orderById: (orderId: string) => `/orders/${orderId}`,
  orderReceipt: (orderId: string) => `/orders/${orderId}/receipt`,

  /** Perfil do colecionador. */
  profile: '/profile',
  profileAvatar: '/profile/avatar',
  profilePassword: '/profile/password',

  /** Carteiras. */
  wallets: '/wallets',
  walletById: (walletId: string) => `/wallets/${walletId}`,
} as const;

/** Padroes de rota (formato do MSW) equivalentes aos caminhos parametrizados. */
export const API_PATTERNS = {
  /**
   * Sonda de disponibilidade da camada de mocks.
   * Nao tem funcao no app (o catalogo ja prova a cadeia de ponta a ponta);
   * continua respondendo para conferir, no ambiente publicado, se o worker
   * esta no ar.
   */
  health: '/health',
  signUp: '/auth/signup',
  login: '/auth/login',
  session: '/auth/session',
  logout: '/auth/logout',
  nfts: '/nfts',
  nftById: '/nfts/:nftId',
  favorites: '/favorites',
  favoriteByNftId: '/favorites/:nftId',
  cart: '/cart',
  cartItems: '/cart/items',
  cartItemById: '/cart/items/:itemId',
  quotes: '/quotes',
  orders: '/orders',
  orderById: '/orders/:orderId',
  orderReceipt: '/orders/:orderId/receipt',
  profile: '/profile',
  profileAvatar: '/profile/avatar',
  profilePassword: '/profile/password',
  wallets: '/wallets',
  walletById: '/wallets/:walletId',
} as const;

/** Cabecalho que carrega a chave de idempotencia das mutations de pedido. */
export const IDEMPOTENCY_KEY_HEADER = 'x-idempotency-key';

/** Cabecalho com o token da sessao simulada (`Bearer <token>`). */
export const AUTHORIZATION_HEADER = 'authorization';

/** Prefixo do esquema de autorizacao usado pela API simulada. */
export const BEARER_PREFIX = 'Bearer ';

/**
 * Cabecalho com a identidade do visitante (nao autenticado).
 * E o que permite ao servidor simulado manter um carrinho por visitante e
 * transferi-lo para a conta no login, sem vazar dados entre usuarios.
 */
export const GUEST_ID_HEADER = 'x-guest-id';

/** Tempo maximo (ms) de espera de uma requisicao REST antes do timeout. */
export const REQUEST_TIMEOUT_MS = 15_000;
