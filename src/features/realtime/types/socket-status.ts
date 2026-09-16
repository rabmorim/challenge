/**
 * Estado da conexao de tempo real, exposto a interface para dar feedback
 * acessivel sobre reconexao e indisponibilidade.
 */
export type SocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * Forma mínima usada para registrar e remover listeners do socket.
 * Existe para que o hook genérico de assinatura não dependa das condicionais
 * de tipo do `socket.io-client`, que não reduzem com o nome do evento genérico.
 */
export interface SocketEventBinder {
  on: (event: string, listener: (...args: unknown[]) => void) => void;
  off: (event: string, listener: (...args: unknown[]) => void) => void;
}
