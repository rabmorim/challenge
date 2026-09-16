/**
 * Contrato minimo que o emissor da simulacao precisa de uma conexao.
 *
 * O `@mswjs/socket.io-binding` nao exporta o tipo da sua conexao, entao
 * descrevemos apenas o que usamos — o que tambem deixa o emissor testavel sem
 * abrir socket de verdade.
 */
export interface SocketEmitter {
  /**
   * Envia um evento ao cliente conectado.
   *
   * @param event - Nome do evento (ver `SOCKET_EVENTS`).
   * @param data - Argumentos do evento.
   */
  emit(event: string, ...data: unknown[]): void;
}
