/**
 * Faixas de viewport usadas quando uma tela tem duas composicoes distintas.
 *
 * O valor espelha o breakpoint `md` do Tailwind (768px): abaixo dele valem os
 * frames de 414 do Figma, acima valem os de 1440. Ele mora aqui — e nao solto
 * no componente — porque a mesma fronteira e desenhada em CSS (`md:`) e lida em
 * JavaScript; duas escritas do mesmo numero sairiam de sincronia.
 */
export const COMPACT_LAYOUT_QUERY = '(max-width: 767.98px)';
