/**
 * Contrato de eventos do Socket.IO.
 *
 * O binding do MSW e experimental: trabalhamos apenas no namespace raiz, sem
 * rooms nem broadcast seletivo.
 */
export const SOCKET_EVENTS = {
  /** Preco/disponibilidade de um NFT mudou (catalogo, detalhe e carrinho). */
  nftUpdated: 'nft.updated',
  /** Estado de um pedido mudou (pendente -> confirmado/recusado). */
  orderUpdated: 'order.updated',
  /** Cliente informa qual sessao esta assinando os eventos. */
  identify: 'session.identify',
} as const;

/** Namespace unico suportado pelo binding do MSW. */
export const SOCKET_NAMESPACE = '/';

/** Caminho padrao do transporte engine.io. */
export const SOCKET_PATH = '/socket.io';

/**
 * Rotulos em portugues para cada estado da conexao de tempo real.
 * Ficam aqui (e nao no componente) para que o texto seja reutilizado por
 * qualquer indicador de conexao sem duplicacao.
 */
export const SOCKET_STATUS_LABELS = {
  connecting: 'conectando...',
  connected: 'conectado',
  disconnected: 'desconectado',
  error: 'falha na conexão',
} as const;
