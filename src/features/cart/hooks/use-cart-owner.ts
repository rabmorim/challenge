import { useSession } from '@/features/auth/hooks/use-session';
import { GUEST_CART_OWNER } from '@/features/cart/constants/cart';

/**
 * Dono corrente do carrinho.
 *
 * O carrinho é o único recurso que não é público nem exclusivo de uma conta:
 * existe para o visitante (identificado pelo `x-guest-id`) e para o usuário
 * autenticado. Esta é a única função que traduz "quem está na frente da tela"
 * para o segmento da query key — assim nenhum hook decide isso por conta
 * própria e o isolamento entre sessões continua estrutural.
 *
 * @returns Id do usuário autenticado, ou `GUEST_CART_OWNER` para visitante.
 */
export function useCartOwner(): string {
  const { user } = useSession();
  return user?.id ?? GUEST_CART_OWNER;
}
