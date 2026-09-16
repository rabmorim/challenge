/**
 * Anel de foco por teclado, declarado como utilidade.
 *
 * O tema já traz a regra `:focus-visible` na camada base (`globals.css`), mas
 * ela perde para qualquer `outline-none` aplicado ao elemento: utilidade vence
 * camada base no Tailwind v4, independentemente de especificidade. Todo
 * primitivo que apaga o contorno nativo precisa, portanto, redeclarar o anel —
 * e todos usam ESTA constante, para que o indicador seja o mesmo em toda a
 * interface e uma eventual mudança aconteça em um lugar só.
 *
 * O Figma não desenha foco (desvio registrado no ARCHITECTURE); o anel existe
 * porque navegação por teclado com foco visível é requisito do enunciado §8.
 */
export const FOCUS_RING_CLASS =
  'focus-visible:outline-ring focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2';

/**
 * Área de toque mínima de 24px (WCAG 2.5.8) obtida por pseudo-elemento.
 *
 * Cresce FORA do fluxo, então o indicador continua com a medida do Figma e o
 * espaçamento da fila não muda. Usado nos pontos de carrossel, que o design
 * desenha com 8–10px.
 */
export const TOUCH_TARGET_EXPANSION_CLASS = 'before:absolute before:-inset-2 before:content-[""]';
