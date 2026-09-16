/**
 * Caminhos das rotas do app.
 * Centralizados para que nenhum componente carregue a string da URL solta.
 * Novas telas entram aqui junto com a rota correspondente.
 */
export const ROUTES = {
  home: '/',
  /** Catálogo em tela cheia — destino do item "Mercado" do menu. */
  marketplace: '/mercado',
  /** Detalhe do NFT; aceita id ou slug. */
  nftDetail: '/nft/$nftId',
  /** Carrinho de NFTs. */
  cart: '/carrinho',
  /**
   * Pagamento — rota privada. E o guard dela que faz o gate de sessao do
   * "Conectar e finalizar" do carrinho.
   */
  checkout: '/pagamento',
  /** Rota privada — exige sessao (ver `requireAuth`). */
  profile: '/perfil',
  /** Carteiras do colecionador — rota privada, mesmo shell do perfil. */
  wallets: '/carteiras',
  /** Rota privada com os favoritos do colecionador. */
  favorites: '/favoritos',
} as const;

/**
 * Monta o caminho do detalhe de um NFT.
 *
 * @param nftId - Id ou slug do NFT.
 * @returns Caminho pronto para `Link`/`navigate`.
 */
export function nftDetailPath(nftId: string): string {
  return `/nft/${nftId}`;
}

/**
 * Ids das rotas na arvore do TanStack Router.
 *
 * Nao sao os caminhos: `ROUTES.checkout` e `/pagamento` (o que aparece na barra
 * de endereco), enquanto o id inclui o layout privado que a envolve. As APIs do
 * router que recebem `from` pedem o ID, e trocar um pelo outro nao compila —
 * por isso os dois convivem aqui, lado a lado.
 */
export const ROUTE_IDS = {
  checkout: '/_private/pagamento',
  /** Shell de conta: envolve perfil e carteiras sem aparecer na URL. */
  account: '/_private/_account',
} as const;
