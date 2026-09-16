import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

import { SOCKET_EVENTS } from '@/constants/socket';
import { cartQueryOptions } from '@/features/cart/api/cart-queries';
import { useCartOwner } from '@/features/cart/hooks/use-cart-owner';
import {
  orderQueryOptions,
  orderReceiptQueryOptions,
} from '@/features/checkout/api/checkout-queries';
import { TERMINAL_ORDER_STATUSES } from '@/features/checkout/constants/checkout';
import type { Order } from '@/features/checkout/types/order';
import type { OrderPhase, OrderTrackingApi } from '@/features/checkout/types/checkout-state';
import { useSocketEvent } from '@/features/realtime/hooks/use-socket-event';
import { useSocketStatus } from '@/features/realtime/hooks/use-socket-status';
import type { OrderUpdatedEvent } from '@/features/realtime/types/events';
import { queryKeys } from '@/lib/query-keys';

/**
 * Acompanha um pedido do `pending` ate o estado terminal.
 *
 * **A interface nunca marca um pedido como confirmado.** O `2xx` da criacao diz
 * apenas "pedido existe"; quem resolve e a simulacao, por `order.updated`, e a
 * palavra final e sempre do REST — o evento invalida a query e o estado exibido
 * e o que o servidor devolveu. Sem evento, o pedido fica pendente para sempre
 * (e literalmente o cenario `payment-manual`).
 *
 * **Tres guardas antes de aplicar um evento**, nesta ordem:
 *
 * 1. **dono** — `payload.userId` precisa ser o usuario da sessao; evento de uma
 *    sessao anterior nunca toca dado de outro;
 * 2. **terminalidade** — `confirmed` e `declined` nao reabrem, nem com uma
 *    versao maior. O servidor faz o mesmo no-op, e o cliente nao pode ser mais
 *    permissivo que ele;
 * 3. **versao** — evento com versao menor ou igual a que esta em cache e
 *    duplicata ou entrega atrasada: descartado sem reaplicar efeito.
 *
 * **Reconciliacao apos reconexao.** Quando a conexao volta, o estado e relido
 * do REST: uma queda durante o `pending` nao pode deixar a tela presa num
 * estado que o servidor ja mudou — e a releitura nao cria compra nenhuma.
 *
 * @param userId - Dono do pedido.
 * @param orderId - Pedido acompanhado, ou `null` quando ainda nao ha um.
 * @returns Estado do pedido e o recibo, quando ele existe.
 */
export function useOrderTracking(userId: string, orderId: string | null): OrderTrackingApi {
  const queryClient = useQueryClient();
  const cartOwner = useCartOwner();
  const socketStatus = useSocketStatus();

  const orderQuery = useQuery(orderQueryOptions(userId, orderId));
  const order = orderQuery.data ?? null;
  const isTerminal = order !== null && TERMINAL_ORDER_STATUSES.includes(order.status);

  const receiptQuery = useQuery(
    orderReceiptQueryOptions(userId, orderId, order?.status === 'confirmed'),
  );

  const handleOrderUpdated = useCallback(
    (event: OrderUpdatedEvent) => {
      if (event.payload.userId !== userId) return;

      const key = orderQueryOptions(userId, event.id).queryKey;
      const cached = queryClient.getQueryData<Order>(key);

      if (cached) {
        if (TERMINAL_ORDER_STATUSES.includes(cached.status)) return;
        if (event.version <= cached.version) return;

        // Espelho local para a tela reagir no mesmo quadro; a invalidacao logo
        // abaixo traz o pedido inteiro como o servidor o tem.
        queryClient.setQueryData<Order>(key, {
          ...cached,
          version: event.version,
          status: event.payload.status,
          transactionHash: event.payload.transactionHash,
          declineReason: event.payload.declineReason,
          updatedAt: event.occurredAt,
        });
      }

      void queryClient.invalidateQueries({ queryKey: key });

      if (TERMINAL_ORDER_STATUSES.includes(event.payload.status)) {
        // Confirmado remove do carrinho apenas o que foi comprado; recusado
        // preserva tudo. Quem decide e o servidor — aqui so relemos.
        void queryClient.invalidateQueries({ queryKey: cartQueryOptions(cartOwner).queryKey });
        void queryClient.invalidateQueries({ queryKey: queryKeys.publicRoot() });
      }
    },
    [cartOwner, queryClient, userId],
  );

  useSocketEvent(SOCKET_EVENTS.orderUpdated, handleOrderUpdated);

  /** Estado anterior da conexao, para detectar o retorno dela. */
  const previousStatus = useRef(socketStatus);

  useEffect(() => {
    const wasDown = previousStatus.current !== 'connected';
    previousStatus.current = socketStatus;

    if (!wasDown || socketStatus !== 'connected') return;
    if (orderId === null || isTerminal) return;

    // A conexao voltou com um pedido pendente: o REST reconcilia o que os
    // eventos perdidos diriam, sem criar outra compra.
    void queryClient.invalidateQueries({
      queryKey: orderQueryOptions(userId, orderId).queryKey,
    });
  }, [isTerminal, orderId, queryClient, socketStatus, userId]);

  const phase: OrderPhase =
    order === null ? 'idle' : order.status === 'pending' ? 'pending' : order.status;

  return {
    phase,
    order,
    receipt: receiptQuery.data ?? null,
    isReceiptPending: receiptQuery.isPending && order?.status === 'confirmed',
  };
}
