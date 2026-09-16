/**
 * Textos dos favoritos.
 *
 * As mensagens de sucesso e falha são anunciadas por região viva (`aria-live`)
 * além de aparecerem no toast: uma mudança que só existe em cor de ícone não
 * chega a quem navega por leitor de tela.
 */
export const FAVORITES_COPY = {
  /** Rótulo acessível do botão quando o item ainda não é favorito. */
  add: 'Favoritar',
  /** Rótulo acessível quando o item já é favorito. */
  remove: 'Remover dos favoritos',
  added: 'NFT adicionado aos favoritos.',
  removed: 'NFT removido dos favoritos.',
  failed: 'Não foi possível atualizar seus favoritos. O estado anterior foi restaurado.',
  /** Motivo pelo qual o visitante é levado ao painel de autenticação. */
  requiresSession: 'Entre na sua conta para favoritar NFTs.',
  emptyTitle: 'Você ainda não favoritou nenhum NFT.',
  emptyDescription: 'Explore o catálogo e toque no coração para guardar o que gostar.',
  listTitle: 'Meus favoritos',
  /** Nome da grade, só para leitor de tela — fecha a ordem `h1 → h2 → h3`. */
  gridLabel: 'NFTs favoritados',
} as const;
