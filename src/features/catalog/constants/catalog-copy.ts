/**
 * Textos do catálogo.
 *
 * Ficam reunidos aqui (e não soltos no JSX) porque metade deles é rótulo
 * acessível ou mensagem de estado — e esses precisam ser consistentes entre a
 * grade, o destaque, o detalhe e os testes.
 */
export const CATALOG_COPY = {
  /** Região principal do catálogo, para o `aria-label` do bloco. */
  sectionLabel: 'Catálogo de NFTs',
  sidebarLabel: 'Filtros do catálogo',
  gridLabel: 'Resultados do catálogo',

  filtersTrigger: 'Filtros',
  filtersTitle: 'Filtrar catálogo',
  filtersDescription: 'Escolha coleções, faixa de preço e rede.',
  filtersClose: 'Fechar filtros',
  filtersApply: 'Ver resultados',
  filtersActive: 'filtros ativos',

  collectionsTitle: 'Coleções',
  priceTitle: 'Faixa de preço',
  networksTitle: 'Rede',
  applyPrice: 'Aplicar',
  clearFilters: 'Limpar filtros',
  sortLabel: 'Ordenar por:',
  tabsLabel: 'Recorte do catálogo',

  searchLabel: 'Buscar NFTs',
  searchPlaceholder: 'Explorar coleções',
  searchSubmit: 'Buscar',
  searchClear: 'Limpar busca',

  addToCart: 'Adicionar ao carrinho:',
  /** Estado do botão quando a edição não tem mais unidades. */
  addToCartSoldOut: 'edição esgotada',
  viewDetail: 'Ver detalhes de',

  featuredTitle: 'NFT EM DESTAQUE',
  featuredSubtitle: 'OFERTA LIMITADA',

  loading: 'Carregando NFTs...',
  refreshing: 'Atualizando resultados...',
  emptyTitle: 'Nenhum NFT encontrado',
  emptyDescription: 'Ajuste a busca ou os filtros para ver outros resultados.',
  errorTitle: 'Não foi possível carregar o catálogo',
  errorRetry: 'Tentar novamente',

  paginationLabel: 'Paginação do catálogo',
  previousPage: 'Página anterior',
  nextPage: 'Próxima página',
  /**
   * Resumo do resultado, anunciado por região viva quando a consulta muda.
   *
   * @param total - Total de itens encontrados.
   * @param page - Página exibida.
   * @param totalPages - Total de páginas.
   * @returns Frase pronta para o `aria-live`.
   */
  resultsSummary: (total: number, page: number, totalPages: number) =>
    total === 0
      ? 'Nenhum NFT encontrado.'
      : `${String(total)} ${total === 1 ? 'NFT encontrado' : 'NFTs encontrados'}. Página ${String(page)} de ${String(totalPages)}.`,
} as const;

/** Textos das seções editoriais da Início (promoções e diário). */
export const HOME_COPY = {
  heroEyebrow: 'Bem-vindo à Kurio',
  heroTitle: 'SEJA DONO DO FUTURO DA ARTE DIGITAL',
  heroTitleMobile: 'SEJA DONO DA CULTURA DIGITAL',
  heroDescription:
    'Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet.',
  /** Versão curta do frame de 414, onde o cartão do herói tem 190px de altura. */
  heroDescriptionMobile: 'Descubra NFTs selecionados de criadores do mundo todo.',
  heroCta: 'EXPLORAR',
  heroImageAlt: 'Ape de jaqueta esmeralda, óculos escuros e pingente de esmeralda',
  heroCarouselLabel: 'Destaques da Kurio',

  promosTitle: 'Destaques da Kurio',
  journalTitle: 'Diário da Cunhagem',
  journalSubtitle:
    'Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.',
  journalReadMore: 'Ler mais',
} as const;

/** Textos da rota de Mercado (catálogo em tela cheia). */
export const MARKETPLACE_COPY = {
  title: 'Mercado',
  description: 'Todo o catálogo da Kurio, com busca, filtros combináveis e ordenação.',
  breadcrumbLabel: 'Trilha de navegação',
} as const;
