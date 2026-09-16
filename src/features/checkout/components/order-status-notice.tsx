import { Button } from '@/components/ui/button';
import { ORDER_DECLINE_LABELS } from '@/features/checkout/constants/checkout';
import { ORDER_COPY } from '@/features/checkout/constants/checkout-copy';
import type { OrderStatusNoticeProps } from '@/features/checkout/types/checkout-components';

/**
 * Estado do pedido depois do envio: pendente, incerto ou recusado.
 *
 * Três situações que o Figma não desenha porque ele desenha só o caminho feliz,
 * mas que o enunciado exige representar:
 *
 * - **pendente** — o pedido existe e a simulação ainda não respondeu. A tela
 *   diz isso e diz também que recarregar não perde nada, porque não perde: a
 *   tentativa está gravada e o pedido é reencontrado pelo REST.
 * - **incerto** (`unknown`) — o timeout. A honestidade aqui é o ponto: não
 *   sabemos se o pedido foi criado, e "tentar novamente" **recupera o mesmo
 *   pedido** em vez de criar outro, porque reenvia a mesma chave.
 * - **recusado** — estado terminal. Os itens continuam no carrinho (o servidor
 *   não removeu nada) e tentar de novo começa outra tentativa, com chave nova.
 *
 * @param props - Estado do pedido e as ações de retomada.
 */
export function OrderStatusNotice({ order }: OrderStatusNoticeProps) {
  if (order.phase === 'pending') {
    return (
      <section data-testid="order-pending" className="border-input rounded-control flex flex-col gap-1.5 border p-4">
        <p className="text-body-lg font-bold">{ORDER_COPY.pendingTitle}</p>
        <p className="text-tan text-caption">{ORDER_COPY.pendingDescription}</p>
      </section>
    );
  }

  if (order.phase === 'unknown') {
    return (
      <section
        role="alert"
        data-testid="order-unknown"
        className="border-primary rounded-control flex flex-col gap-3 border p-4"
      >
        <p className="text-body-lg font-bold">{ORDER_COPY.unknownTitle}</p>
        <p className="text-tan text-caption">{ORDER_COPY.unknownDescription}</p>
        <Button data-testid="order-retry" onClick={order.submit}>
          {ORDER_COPY.unknownRetry}
        </Button>
      </section>
    );
  }

  if (order.phase === 'declined') {
    return (
      <section
        role="alert"
        data-testid="order-declined"
        className="border-destructive rounded-control flex flex-col gap-3 border p-4"
      >
        <p className="text-body-lg font-bold">{ORDER_COPY.declinedTitle}</p>
        <p className="text-tan text-caption">
          {ORDER_DECLINE_LABELS[order.order?.declineReason ?? 'PAYMENT_DECLINED']}{' '}
          {ORDER_COPY.declinedKeepItems}
        </p>
        <Button data-testid="order-retry-declined" onClick={order.retryAfterDecline}>
          {ORDER_COPY.declinedRetry}
        </Button>
      </section>
    );
  }

  if (order.error) {
    return (
      <p role="alert" data-testid="order-error" className="text-destructive text-caption">
        {order.error.message}
      </p>
    );
  }

  return null;
}
