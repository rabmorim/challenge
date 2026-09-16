/** Textos da tela de detalhe do NFT. */
export const DETAIL_COPY = {
  breadcrumbLabel: 'Trilha de navegação',
  back: 'Voltar para a tela anterior',
  galleryLabel: 'Galeria do NFT',
  /**
   * Rótulo de cada miniatura da galeria.
   *
   * @param index - Posição da miniatura (base 1).
   * @param name - Nome do NFT.
   * @returns Rótulo acessível da miniatura.
   */
  thumbLabel: (index: number, name: string) => `Ver imagem ${String(index)} de ${name}`,
  zoomLabel: 'Abrir a arte em tamanho cheio',

  aboutTitle: 'Sobre este NFT:',
  editionTitle: 'Edição:',
  editionLabel: 'Edições desta coleção',
  editionOpen: 'ABERTA',
  editionSoldOut: 'ESGOTADA',
  editionUnavailable: 'Edição indisponível',
  /**
   * Rótulo de um chip de edição.
   *
   * Começa pelo texto VISÍVEL do chip (`1/50`) porque WCAG 2.5.3 exige que o
   * nome acessível contenha o rótulo que aparece na tela — sem isso, quem
   * comanda por voz não consegue dizer "clicar em um barra cinquenta".
   *
   * @param total - Unidades cunhadas na edição.
   * @param name - Nome do NFT daquela edição.
   * @returns Rótulo acessível do chip.
   */
  editionChipLabel: (total: number, name: string) =>
    `1/${String(total)} — Edição de ${String(total)} unidades, ${name}`,

  quantityLabel: 'Quantidade',
  quantityShort: 'Qtd.',
  decrease: 'Diminuir quantidade',
  increase: 'Aumentar quantidade',
  /**
   * Teto de quantidade, anunciado junto do seletor.
   *
   * O frame não escreve a disponibilidade, mas quem usa teclado e leitor de
   * tela precisa saber por que o "+" para de responder.
   *
   * @param available - Unidades ainda à venda.
   * @param max - Máximo permitido por pedido.
   * @returns Frase lida pela tecnologia assistiva.
   */
  quantityHint: (available: number, max: number) =>
    `${String(available)} ${available === 1 ? 'unidade disponível' : 'unidades disponíveis'}. Máximo de ${String(max)} por pedido.`,

  tokenId: 'ID do token:',
  collection: 'Coleção:',
  traits: 'Atributos:',
  share: 'Compartilhar este NFT:',
  shareLinkedin: 'Compartilhar este NFT no LinkedIn',
  shareEmail: 'Compartilhar este NFT por e-mail',
  shareTwitter: 'Compartilhar este NFT no Twitter',

  tabsLabel: 'Informações do NFT',
  tabDetails: 'Detalhes do NFT',
  /**
   * Rótulo da aba de avaliações, com a contagem.
   *
   * @param count - Total de avaliações.
   * @returns Texto da aba.
   */
  tabReviews: (count: number) => `Avaliações de colecionadores (${String(count)})`,
  /**
   * Resumo da nota, ao lado do preço.
   *
   * @param count - Total de avaliações.
   * @returns Texto exibido ao lado das estrelas.
   */
  ratingSummary: (count: number) =>
    `${String(count)} ${count === 1 ? 'avaliação de colecionador' : 'avaliações de colecionadores'}`,
  /**
   * Rótulo acessível da nota.
   *
   * @param average - Média em string decimal.
   * @returns Frase com a nota, que as estrelas sozinhas não anunciam.
   */
  ratingLabel: (average: string) => `Nota média: ${average} de 5`,
  reviewsEmpty: 'Este NFT ainda não recebeu avaliações.',

  networkTitle: 'Rede:',
  contractTitle: 'Contrato:',
  royaltiesTitle: 'Direitos autorais:',
  /**
   * Descrição da rede onde o NFT foi cunhado.
   *
   * @param network - Nome da rede.
   * @returns Frase da seção "Rede".
   */
  networkDescription: (network: string) =>
    `Cunhado na ${network} com procedência imutável e metadados armazenados no IPFS.`,
  royaltiesDescription:
    'Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.',
  /**
   * Linha do contrato simulado.
   *
   * @param address - Endereço do contrato.
   * @returns Texto com o endereço encurtado.
   */
  contractDescription: (address: string) =>
    `${address.slice(0, 6)}...${address.slice(-4)} • Contrato inteligente ERC-721 verificado.`,

  relatedTitle: 'Mais desta coleção',
  relatedEmpty: 'Esta coleção não tem outros itens no momento.',
  notFoundTitle: 'NFT não encontrado',
  notFoundDescription: 'Este NFT não existe ou saiu do catálogo.',
  notFoundAction: 'Ver o catálogo',
  errorTitle: 'Não foi possível carregar este NFT',
  errorRetry: 'Tentar novamente',
  loading: 'Carregando o NFT...',
} as const;

/**
 * Miniaturas da galeria do detalhe.
 * O esqueleto reserva exatamente esta quantidade para não deslocar a coluna
 * quando a galeria chega.
 */
export const GALLERY_THUMB_COUNT = 4;

/**
 * Chips de tiragem exibidos antes do chip de estado da edição.
 * O frame desenha três; a coleção tem mais tiragens que isso.
 */
export const EDITION_CHIPS_LIMIT = 3;

/**
 * Dimensões nativas da arte do frame de 414 (largura útil de 358 e altura de
 * 356 no Figma). Vão declaradas no `img` para a chegada da imagem não empurrar
 * a folha de informações logo abaixo.
 */
export const DETAIL_ART_WIDTH = 358;

/** Altura (px) da arte do frame de 414. */
export const DETAIL_ART_HEIGHT = 356;

/**
 * Endereços de intenção de compartilhamento das redes do frame.
 *
 * São as URLs públicas de cada rede — a página abre numa aba nova com o link do
 * NFT já preenchido, sem que a aplicação precise de sessão na rede de destino.
 */
export const SHARE_INTENT_URLS = {
  linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=',
  twitter: 'https://twitter.com/intent/tweet?url=',
} as const;

/**
 * Quantidade de atributos exibidos na linha de resumo.
 * Os três primeiros são os que distinguem a peça; a tabela completa fica na
 * aba "Detalhes do NFT".
 */
export const SUMMARY_TRAITS_COUNT = 3;
