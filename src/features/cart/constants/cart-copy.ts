import { formatEth } from '@/lib/eth';
import type { EthAmount, Quantity } from '@/types/api';

/** Textos da tela do carrinho e do selo do header. */
export const CART_COPY = {
  /**
   * Rótulo acessível do ícone do header.
   *
   * @param count - Itens no carrinho.
   * @returns Texto que diz também a contagem, que o número sozinho não anuncia.
   */
  badgeLabel: (count: number) =>
    count === 0
      ? 'Carrinho de NFTs (vazio)'
      : `Carrinho de NFTs (${String(count)} ${count === 1 ? 'item' : 'itens'})`,

  title: 'Carrinho de NFTs',
  breadcrumbLabel: 'Trilha de navegação',
  breadcrumbHome: 'Início',
  breadcrumbCurrent: 'Carrinho',
  back: 'Voltar para a tela anterior',
  /** Texto do destino de foco usado depois de remover uma linha. */
  focusAnchor: 'Lista do carrinho atualizada.',

  /** Cabeçalhos da tabela do frame de 1440. */
  columnNfts: 'NFTs',
  columnPrice: 'Preço',
  columnEditions: 'Edições',
  columnTotal: 'Total',
  /** Coluna sem rótulo desenhado: a lixeira precisa de cabeçalho mesmo assim. */
  columnActions: 'Ações',

  tokenId: 'ID do token:',

  /**
   * Tiragem da edição, como o frame de 414 a escreve.
   *
   * @param total - Unidades cunhadas na edição.
   * @returns Texto `Edição: 1/50`.
   */
  edition: (total: number) => `Edição: 1/${String(total)}`,

  /**
   * Rótulo acessível do total de uma linha.
   *
   * @param name - Nome do NFT.
   * @returns Texto que amarra o valor ao item, que a coluna sozinha não diz.
   */
  lineTotalLabel: (name: string) => `Total de ${name}`,

  /**
   * Rótulo do campo de quantidade de uma linha.
   *
   * @param name - Nome do NFT.
   * @returns Texto que diz de qual item é a quantidade.
   */
  quantityLabel: (name: string) => `Quantidade de ${name}`,

  /**
   * Rótulo do botão de diminuir.
   *
   * @param name - Nome do NFT.
   * @returns Texto que nomeia o item, porque a tabela tem vários "−".
   */
  decrease: (name: string) => `Diminuir a quantidade de ${name}`,

  /**
   * Rótulo do botão de aumentar.
   *
   * @param name - Nome do NFT.
   * @returns Texto que nomeia o item.
   */
  increase: (name: string) => `Aumentar a quantidade de ${name}`,

  loadingItems: 'Carregando o carrinho...',

  emptyTitle: 'Seu carrinho está vazio',
  emptyDescription:
    'Nenhum NFT por aqui ainda. Explore o mercado e escolha a primeira peça da sua coleção.',

  errorTitle: 'Não foi possível carregar o carrinho',
  errorRetry: 'Tentar novamente',
  /** Usado quando a falha chega sem mensagem própria (não deveria acontecer). */
  errorFallback: 'Erro inesperado ao falar com a API.',
} as const;

/** Textos do resumo (a sidebar de 1440 e o painel de 414). */
export const CART_SUMMARY_COPY = {
  title: 'Resumo da carteira',
  couponLabel: 'Código promocional',
  couponPlaceholder: 'Digite o código promocional...',
  couponApply: 'Aplicar',
  couponApplying: 'Aplicando...',

  /**
   * Rótulo do botão que retira o cupom aplicado.
   *
   * @param code - Cupom em vigor.
   * @returns Texto que nomeia o cupom, para o botão não ser um "remover" solto.
   */
  couponRemove: (code: string) => `Remover o cupom ${code}`,

  subtotal: 'Subtotal',
  discount: 'Desconto do lançamento',
  networkFee: 'Taxa de rede',
  networkFeeNote: 'Taxa estimada',
  total: 'Total',

  /** Traço do desconto quando não há cupom, exatamente como o frame escreve. */
  noDiscount: '(-) 00.00',

  /**
   * Desconto aplicado, com o sinal do frame.
   *
   * @param amount - Valor já formatado.
   * @returns Texto `(-) 2.68 ETH`.
   */
  discountValue: (amount: string) => `(-) ${amount}`,

  checkout: 'Conectar e finalizar',
  keepExploring: 'Continuar explorando',

  /** A cotação falhou por um motivo que não é o cupom. */
  errorTitle: 'Não foi possível calcular o resumo',
  errorRetry: 'Recalcular',
} as const;

/** Seção "Colecionadores também viram", abaixo da tabela. */
export const ALSO_VIEWED_COPY = {
  title: 'Colecionadores também viram',
  empty: 'Nada mais para ver por aqui no momento.',
} as const;

/** Textos da remoção de item, que pede confirmação. */
export const CART_REMOVE_COPY = {
  /**
   * Rótulo da lixeira.
   *
   * @param name - Nome do NFT.
   * @returns Texto que diz o que sai, e não apenas "remover".
   */
  trigger: (name: string) => `Remover ${name} do carrinho`,

  title: 'Remover do carrinho?',

  /**
   * Corpo da confirmação.
   *
   * @param name - Nome do NFT.
   * @returns Pergunta que nomeia o item.
   */
  description: (name: string) => `${name} sai do carrinho. Dá para adicionar de novo depois.`,

  confirm: 'Remover',
  cancel: 'Manter no carrinho',
} as const;

/** Ações de compra do detalhe e do card do catálogo. */
export const ADD_TO_CART_COPY = {
  /** Botão do painel do frame de 1440. */
  buy: 'COMPRAR',
  /** Botão da barra fixa do frame de 414. */
  buyDetail: 'Comprar NFT',
  addToCart: 'Adicionar ao carrinho',
  /** Explicação do gate de sessão do botão de compra do detalhe. */
  requiresSession: 'Entre na sua conta para comprar este NFT.',
} as const;

/**
 * Feedback das mutations do carrinho.
 *
 * Cada mensagem existe em uma versão só: o toast e a região viva dizem o mesmo
 * texto, para que quem ouve a tela receba exatamente a informação de quem a vê.
 */
export const CART_FEEDBACK = {
  /**
   * Item acrescentado ao carrinho.
   *
   * @param name - Nome do NFT.
   * @param quantity - Unidades acrescentadas.
   * @returns Texto do toast e da região viva.
   */
  added: (name: string, quantity: Quantity) =>
    `${name} adicionado ao carrinho (${String(quantity)} ${quantity === 1 ? 'unidade' : 'unidades'}).`,

  /**
   * Quantidade alterada.
   *
   * @param name - Nome do NFT.
   * @param quantity - Nova quantidade.
   * @returns Texto da região viva.
   */
  quantityChanged: (name: string, quantity: Quantity) =>
    `${name}: quantidade alterada para ${String(quantity)}.`,

  /**
   * Quantidade aparada no teto da edição.
   *
   * @param name - Nome do NFT.
   * @param max - Teto aplicado.
   * @returns Texto que diz o motivo, e não apenas que o valor mudou.
   */
  quantityClamped: (name: string, max: Quantity) =>
    `${name}: restam ${String(max)} ${max === 1 ? 'unidade disponível' : 'unidades disponíveis'}. A quantidade foi ajustada.`,

  /**
   * Item removido.
   *
   * @param name - Nome do NFT.
   * @returns Texto do toast e da região viva.
   */
  removed: (name: string) => `${name} removido do carrinho.`,

  /** Falha de qualquer mutation: o estado anterior foi devolvido. */
  failed: 'Não foi possível atualizar o carrinho. O estado anterior foi restaurado.',
} as const;

/**
 * Avisos de tempo real com o carrinho aberto.
 *
 * O enunciado §7 exige que a interface **informe** a alteração — não basta o
 * número mudar sozinho na tela.
 */
export const CART_REALTIME_COPY = {
  /**
   * Preço alterado enquanto o carrinho está aberto.
   *
   * @param name - Nome do NFT.
   * @param price - Novo preço unitário, string decimal da API.
   * @returns Texto do aviso.
   */
  priceChanged: (name: string, price: EthAmount) =>
    `${name} mudou de preço: agora ${formatEth(price)}. O resumo foi recalculado.`,

  /**
   * Disponibilidade reduzida, ainda com unidades.
   *
   * @param name - Nome do NFT.
   * @param available - Unidades restantes.
   * @returns Texto do aviso.
   */
  availabilityChanged: (name: string, available: Quantity) =>
    `${name}: restam ${String(available)} ${available === 1 ? 'unidade' : 'unidades'} nesta edição.`,

  /**
   * Disponibilidade caiu abaixo da quantidade: a linha foi aparada.
   *
   * @param name - Nome do NFT.
   * @param available - Unidades restantes, que viraram a nova quantidade.
   * @returns Texto que diz o motivo e o efeito numa frase só.
   */
  availabilityClamped: (name: string, available: Quantity) =>
    `${name}: restam ${String(available)} ${available === 1 ? 'unidade' : 'unidades'} nesta edição. A quantidade foi ajustada.`,

  /**
   * Edição esgotada com o item no carrinho.
   *
   * @param name - Nome do NFT.
   * @returns Texto do aviso.
   */
  soldOut: (name: string) => `${name} esgotou. Remova o item para continuar a compra.`,
} as const;
