import type { AppIconId, AppIconSpec } from '@/types/components';

/**
 * Ícones exportados do Figma que o pacote de ícones do projeto não cobre.
 *
 * São PNGs monocromáticos de 20/24px. Cada um é pintado como **máscara** (e não
 * como `img`): assim a cor vem do `currentColor` do lugar onde o ícone está —
 * o carrinho é claro sobre o fundo da página, o mesmo glifo de saída é escuro
 * dentro do botão "Entrar" e claro no menu da conta. Um arquivo por glifo, sem
 * variante de cor.
 */
export const APP_ICONS: Record<AppIconId, AppIconSpec> = {
  cart: { src: '/icons/cart.png', size: 24 },
  logout: { src: '/icons/logout.png', size: 20 },
};
