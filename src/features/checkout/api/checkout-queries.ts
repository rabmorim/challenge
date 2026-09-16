import { queryOptions } from '@tanstack/react-query';

import { fetchOrder, fetchOrderReceipt, fetchOrders } from '@/features/checkout/api/orders-api';
import { CHECKOUT_QUERY_SEGMENTS } from '@/features/checkout/constants/checkout';
import { queryKeys } from '@/lib/query-keys';

/**
 * Queries da tela de pagamento: pedidos e recibo.
 *
 * Todas vivem no ramo privado com o id do dono na chave: pedido e recibo sao
 * dados de uma conta, e a troca de usuario remove esse ramo inteiro. Nenhuma
 * delas casaria com a query da outra sessao nem por acidente.
 *
 * As CARTEIRAS nao estao aqui: quem as possui e a feature de carteiras
 * (`wallets/api/wallets-queries.ts`), que as cadastra. Esta tela so as le, e
 * usar a fabrica de la e o que garante que salvar uma carteira atualize o
 * pagamento — sao a mesma entrada de cache, nao duas parecidas.
 *
 * A cotacao tambem nao esta aqui porque nao e exclusiva desta tela — ela mora
 * com o resumo que o carrinho tambem usa (`quote-queries.ts`).
 */

/**
 * Pedidos do usuario.
 *
 * Existe para a **retomada**: ao abrir o pagamento, um pedido ainda pendente e
 * reencontrado aqui, sem criar nada. E o caminho que cobre o refresh e a queda
 * de conexao — o estado vem do REST, nunca de otimismo local.
 *
 * @param userId - Dono dos pedidos.
 * @returns Opcoes da query de pedidos.
 */
export function ordersQueryOptions(userId: string) {
  return queryOptions({
    queryKey: queryKeys.private(userId, CHECKOUT_QUERY_SEGMENTS.orders),
    queryFn: ({ signal }) => fetchOrders(signal),
    staleTime: 0,
  });
}

/**
 * Estado de um pedido.
 *
 * O socket notifica, o REST confirma: `order.updated` invalida esta query e o
 * estado exibido e sempre o que o servidor devolveu.
 *
 * @param userId - Dono do pedido.
 * @param orderId - Id do pedido, ou `null` enquanto nao ha um.
 * @returns Opcoes da query do pedido.
 */
export function orderQueryOptions(userId: string, orderId: string | null) {
  return queryOptions({
    queryKey: queryKeys.private(userId, CHECKOUT_QUERY_SEGMENTS.order, orderId),
    queryFn: ({ signal }) => fetchOrder(orderId ?? '', signal),
    enabled: orderId !== null,
    staleTime: 0,
  });
}

/**
 * Recibo de um pedido.
 *
 * Buscado do servidor (e nao montado a partir do pedido em cache) porque o
 * recibo e um **snapshot imutavel**: ele foi congelado no momento em que o
 * pedido virou terminal, e alteracao posterior no catalogo nao o alcanca.
 *
 * @param userId - Dono do pedido.
 * @param orderId - Id do pedido, ou `null`.
 * @param enabled - `true` somente para pedido confirmado.
 * @returns Opcoes da query do recibo.
 */
export function orderReceiptQueryOptions(
  userId: string,
  orderId: string | null,
  enabled: boolean,
) {
  return queryOptions({
    queryKey: queryKeys.private(userId, CHECKOUT_QUERY_SEGMENTS.receipt, orderId),
    queryFn: ({ signal }) => fetchOrderReceipt(orderId ?? '', signal),
    enabled: enabled && orderId !== null,
    // O recibo nao muda depois de emitido: revalidar seria trafego sem efeito.
    staleTime: Infinity,
  });
}
