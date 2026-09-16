/** Contratos de acessibilidade compartilhados entre features. */

/** Publicador de mensagens para uma região viva (`aria-live`). */
export interface LiveAnnouncer {
  /** Mensagem corrente da região viva. */
  message: string;
  /**
   * Publica um texto na região viva.
   *
   * @param message - Texto já pronto para leitura em voz alta.
   */
  announce: (message: string) => void;
}

/** Props de `LiveRegion`. */
export interface LiveRegionProps {
  message: string;
  /** Marcador usado pelos testes para encontrar a região da tela. */
  testId: string;
  /**
   * `assertive` interrompe o leitor de tela; reservado a avisos que impedem a
   * ação em curso (o bloqueio por cotação desatualizada, por exemplo).
   */
  politeness?: 'polite' | 'assertive';
}
