import type { Quantity } from '@/types/api';

/**
 * Textos da tela de pagamento e da confirmacao.
 *
 * Ficam reunidos aqui (e nao soltos no JSX) porque os mesmos rotulos aparecem
 * nas duas composicoes — 1440 e 414 — e nos anuncios da regiao viva: uma frase
 * escrita duas vezes e uma frase que vai divergir.
 */
export const CHECKOUT_COPY = {
  breadcrumbLabel: 'Trilha de navegação',
  breadcrumbHome: 'Início',
  breadcrumbCurrent: 'Pagamento',

  collectorTitle: 'Perfil do colecionador',
  summaryTitle: 'Seus NFTs',
  summaryItemsHeader: 'NFTs',
  summarySubtotalHeader: 'Subtotal',

  mobileTitle: 'Pagamento com carteira',
  mobileBack: 'Voltar',
  connectedWalletsTitle: 'Carteira conectada',
  switchWallet: 'Trocar carteira',
  walletBlockTitle: 'Carteira e rede',
  mobileTotal: 'Total:',

  couponPrompt: 'Tem um código promocional?',
  couponAction: 'Aplique aqui',
  couponLabel: 'Código promocional',
  couponPlaceholder: 'Digite o código',
  couponApply: 'Aplicar',
  couponApplying: 'Aplicando…',
  /**
   * Rotulo do botao que remove o cupom aplicado.
   *
   * @param code - Codigo aceito pelo servidor.
   * @returns Texto do botao.
   */
  couponRemove: (code: string) => `Remover ${code}`,

  subtotal: 'Subtotal',
  discount: 'Desconto do lançamento',
  networkFee: 'Taxa de rede',
  networkFeeNote: 'Taxa estimada',
  total: 'Total',
  noValue: '(-) 00.00',

  submit: 'Confirmar compra',
  submitting: 'Enviando pedido…',
  awaitingPayment: 'Aguardando a simulação…',

  emptyTitle: 'Não há nada para pagar',
  emptyDescription: 'Seu carrinho está vazio. Escolha um NFT no mercado para continuar.',
  emptyAction: 'Ir ao mercado',

  errorRetry: 'Tentar de novo',
} as const;

/** Textos do formulario do colecionador — rotulos e placeholders do frame. */
export const COLLECTOR_FORM_COPY = {
  displayName: 'Nome de exibição',
  username: 'Nome de usuário',
  network: 'Rede',
  networkPlaceholder: 'Selecione uma rede',
  profileName: 'Nome do perfil',
  walletAddress: 'Endereço da carteira',
  walletAddressPlaceholder: 'Endereço 0x da carteira',
  secondaryWallet: 'ENS ou carteira secundária (opcional)',
  secondaryWalletPlaceholder: 'ENS ou carteira secundária (opcional)',
  walletProvider: 'Tipo de carteira',
  walletProviderPlaceholder: 'Selecione uma carteira',
  referralCode: 'Código de indicação',
  email: 'E-mail',
  ensDomain: 'Nome ENS',
  usesAlternateWallet: 'Usar outra carteira?',
  note: 'Observação do colecionador (opcional)',
} as const;

/** Mensagens de validacao do formulario, iguais as regras do servidor. */
export const COLLECTOR_ERRORS = {
  displayName: 'Informe o nome de exibição (ao menos 3 caracteres).',
  username: 'Informe o nome de usuário (ao menos 3 caracteres).',
  profileName: 'Informe o nome do perfil (ao menos 3 caracteres).',
  email: 'Informe um e-mail válido.',
  walletAddress: 'Endereço inválido: use 0x seguido de 40 caracteres hexadecimais.',
  secondaryWallet: 'Informe um endereço 0x ou um nome ENS (ex.: nova.kurio.eth).',
  referralCode: 'Informe o código de indicação (ao menos 4 caracteres).',
  ensDomain: 'Escolha um domínio ENS.',
  network: 'Escolha a rede da transação.',
  walletProvider: 'Escolha o tipo de carteira.',
  note: 'A observação pode ter no máximo 280 caracteres.',
} as const;

/** Textos do bloco de carteiras e do resultado das conexoes simuladas. */
export const WALLET_COPY = {
  /** Rotulo acessivel do grupo de provedores. */
  providerGroupLabel: 'Carteira e rede',
  /** Rotulo acessivel do grupo de carteiras conectadas. */
  walletGroupLabel: 'Carteira conectada',
  compatibleBadge: 'METAMASK · WALLETCONNECT · COINBASE',
  connect: 'Conectar',
  connecting: 'Conectando…',
  disconnect: 'Desconectar',
  actionsLabel: 'Ações da carteira',
  statusConnected: 'Conectada',
  statusDisconnected: 'Desconectada',
  statusRefused: 'Conexão recusada',
  emptyTitle: 'Nenhuma carteira cadastrada',
  emptyDescription: 'Cadastre uma carteira no seu perfil para concluir a compra.',
  loadError: 'Não foi possível carregar suas carteiras.',
  /**
   * Nome da rede de uma carteira, como o frame de 414 escreve.
   *
   * @param label - Nome da rede.
   * @param isPrimary - `true` quando a carteira e a principal.
   * @returns Texto da linha de rede.
   */
  networkLine: (label: string, isPrimary: boolean) =>
    isPrimary ? `Rede principal ${label}` : `Rede ${label}`,
  /**
   * Anuncio da conexao concluida.
   *
   * @param label - Apelido da carteira.
   * @returns Texto para a regiao viva.
   */
  announceConnected: (label: string) => `Carteira ${label} conectada.`,
  /**
   * Anuncio da desconexao.
   *
   * @param label - Apelido da carteira.
   * @returns Texto para a regiao viva.
   */
  announceDisconnected: (label: string) => `Carteira ${label} desconectada.`,
} as const;

/** Textos do bloqueio por cotacao desatualizada. */
export const STALE_QUOTE_COPY = {
  title: 'Os valores mudaram desde que você abriu o pagamento',
  description:
    'A compra não pode ser confirmada com uma cotação desatualizada. Confira o que mudou e confirme os novos valores para continuar.',
  acknowledge: 'Revisar e confirmar novos valores',
  acknowledging: 'Atualizando valores…',
  /**
   * Linha que descreve a mudanca de preco de um item.
   *
   * @param name - Nome do NFT.
   * @param from - Preco cotado, ja formatado.
   * @param to - Preco atual, ja formatado.
   * @returns Texto da linha.
   */
  priceLine: (name: string, from: string, to: string) => `${name}: ${from} → ${to}`,
  /**
   * Linha que descreve a queda de disponibilidade de um item.
   *
   * @param name - Nome do NFT.
   * @param requested - Quantidade pedida.
   * @param available - Unidades ainda disponiveis.
   * @returns Texto da linha.
   */
  availabilityLine: (name: string, requested: Quantity, available: Quantity) =>
    available === 0
      ? `${name}: edição esgotada (você pediu ${String(requested)}).`
      : `${name}: restam ${String(available)} de ${String(requested)} unidades pedidas.`,
  /** Anuncio do bloqueio para a regiao viva. */
  announce: 'Os valores da compra mudaram. Confirme os novos valores para continuar.',
  expired: 'A cotação expirou. Confirme os novos valores para continuar.',
} as const;

/** Textos do acompanhamento do pedido. */
export const ORDER_COPY = {
  pendingTitle: 'Pedido enviado. Aguardando a confirmação da rede…',
  pendingDescription:
    'A compra só é confirmada quando a simulação responde. Você pode recarregar a página: o pedido continua sendo acompanhado.',
  unknownTitle: 'Não sabemos se o pedido foi criado',
  unknownDescription:
    'A resposta não chegou a tempo. Tentar de novo recupera o mesmo pedido — não cria uma segunda compra.',
  unknownRetry: 'Tentar novamente',
  declinedTitle: 'Pagamento recusado',
  declinedRetry: 'Tentar de novo',
  declinedKeepItems: 'Seus itens continuam no carrinho.',
  /**
   * Anuncio do estado do pedido para a regiao viva.
   *
   * @param reference - Referencia legivel do pedido.
   * @returns Texto para leitura em voz alta.
   */
  announcePending: (reference: string) => `Pedido ${reference} enviado. Aguardando confirmação.`,
  /**
   * Anuncio da confirmacao.
   *
   * @param reference - Referencia legivel do pedido.
   * @returns Texto para leitura em voz alta.
   */
  announceConfirmed: (reference: string) =>
    `Pedido ${reference} confirmado. Seus NFTs estão na sua carteira.`,
  /**
   * Anuncio da recusa.
   *
   * @param reason - Motivo ja traduzido.
   * @returns Texto para leitura em voz alta.
   */
  announceDeclined: (reason: string) => `Pagamento recusado. ${reason}`,
} as const;

/** Textos do recibo (`design/Confirmação de Pedido.png`). */
export const RECEIPT_COPY = {
  dialogTitle: 'Confirmação de pedido',
  headline: 'Seus NFTs agora estão na sua carteira',
  close: 'Fechar confirmação',
  transactionId: 'ID da transação',
  date: 'Data',
  total: 'Total',
  wallet: 'Carteira',
  detailsTitle: 'Detalhes da transação',
  itemsHeader: 'NFTs',
  editionsHeader: 'Edições',
  subtotalHeader: 'Subtotal',
  networkFee: 'Taxa de rede',
  /**
   * Nota de confirmacao do rodape do modal.
   *
   * @param network - Nome da rede usada.
   * @returns Texto da nota.
   */
  note: (network: string) =>
    `Transação confirmada na ${network}. A propriedade foi transferida para sua carteira conectada e registrada na rede.`,
  explorer: 'Ver no Etherscan',
  /**
   * Aviso exibido ao acionar o link de exploracao.
   * A transacao e simulada: abrir um explorador real seria sucesso falso.
   */
  explorerNotice: 'Transação simulada: não há registro em um explorador real.',
  /**
   * Rotulo da quantidade de edicoes de uma linha.
   *
   * @param quantity - Unidades compradas.
   * @returns Texto no formato do frame, ex.: `(x 2)`.
   */
  editions: (quantity: Quantity) => `(x ${String(quantity)})`,
  /**
   * Identificacao do token sob o nome do NFT.
   *
   * @param tokenId - Numero do token.
   * @returns Texto da linha.
   */
  tokenId: (tokenId: string) => `ID do token: #${tokenId}`,
} as const;
