/**
 * Textos da fila de bolinhas que pagina os carrosséis de NFT.
 * Ficam fora das features porque o mesmo controle aparece em "Mais desta
 * coleção" (detalhe) e em "Colecionadores também viram" (carrinho).
 */
export const CAROUSEL_COPY = {
  /**
   * Rótulo acessível de uma bolinha.
   *
   * @param page - Página que a bolinha abre, base 1.
   * @param total - Total de páginas.
   * @returns Texto que diz a posição, que o círculo sozinho não comunica.
   */
  page: (page: number, total: number) => `Página ${String(page)} de ${String(total)}`,
} as const;

/** Lado (px) da arte no card compacto dos carrosséis — medida do frame de 1440. */
export const PREVIEW_CARD_IMAGE_SIZE = 155;
