import { HttpResponse, http, type HttpHandler } from 'msw';

import { API_PATTERNS, IDEMPOTENCY_KEY_HEADER } from '@/constants/api';
import { ENV } from '@/constants/env';
import type {
  CreateOrderRequest,
  Order,
  OrderReceipt,
  OrdersListResponse,
} from '@/features/checkout/types/order';
import { createOrder, findOrder, findReceipt, listOrders } from '@/mocks/db/orders';
import { apiUrl, isActiveSession, readJsonBody, requireSession } from '@/mocks/handlers/shared';
import { conflict, notFound, validationError } from '@/mocks/lib/responses';
import { getActiveScenario, getActiveScenarioId } from '@/mocks/scenarios/active';
import { applyNetworkBehavior, simulateLatency } from '@/mocks/scenarios/network';
import { schedulePaymentResolution } from '@/mocks/socket/scheduler';
import type { OrderFailure } from '@/mocks/types/orders';

/**
 * Pedidos: criacao idempotente, consulta de estado e recibo.
 *
 * O pedido nasce `pending` e so vira `confirmed`/`declined` pela resolucao
 * agendada, que emite `order.updated`. A confirmacao da compra depende, portanto,
 * da resposta da simulacao — nunca de otimismo no fim do checkout.
 */

/** Folga somada ao timeout do cliente no cenario de timeout de pedido. */
const TIMEOUT_MARGIN_MS = 1_500;

/**
 * Traduz a falha de pedido no erro HTTP correspondente.
 *
 * @param failure - Falha devolvida pela criacao.
 * @returns Resposta de erro no envelope padrao.
 */
function toOrderErrorResponse(failure: OrderFailure): Response {
  if (failure.fieldErrors) return validationError(failure.fieldErrors, failure.message);
  return conflict(failure.reason ?? 'QUOTE_STALE', failure.message, failure.conflicts);
}

/** Handlers de pedido. */
export const orderHandlers: HttpHandler[] = [
  http.post(apiUrl(API_PATTERNS.orders), async ({ request }) => {
    const networkFailure = await applyNetworkBehavior();
    if (networkFailure) return networkFailure;

    const result = requireSession(request);
    if (!isActiveSession(result)) return result.response;

    const body = await readJsonBody<CreateOrderRequest>(request);
    if (!body) return validationError({ form: 'Corpo da requisicao invalido.' });

    const created = createOrder(
      result.db,
      result.user,
      body,
      request.headers.get(IDEMPOTENCY_KEY_HEADER),
    );

    if (!created.ok) return toOrderErrorResponse(created.failure);

    if (!created.replayed) {
      const { checkout } = getActiveScenario();

      if (checkout.payment !== 'manual') {
        schedulePaymentResolution(created.order.id, {
          delayMs: checkout.paymentDelayMs,
          outcome: checkout.payment,
          scenario: getActiveScenarioId(),
          ...(checkout.payment === 'decline' ? { declineReason: 'PAYMENT_DECLINED' as const } : {}),
        });
      }

      if (checkout.timeoutAfterOrderCreated) {
        // O pedido ja existe no store; a resposta chega depois do timeout do
        // cliente. Reenviar a mesma chave de idempotencia recupera este pedido.
        await simulateLatency(ENV.requestTimeoutMs + TIMEOUT_MARGIN_MS);
      }
    }

    return HttpResponse.json<Order>(created.order, { status: created.replayed ? 200 : 201 });
  }),

  http.get(apiUrl(API_PATTERNS.orders), async ({ request }) => {
    const networkFailure = await applyNetworkBehavior();
    if (networkFailure) return networkFailure;

    const result = requireSession(request);
    if (!isActiveSession(result)) return result.response;

    return HttpResponse.json<OrdersListResponse>({
      items: listOrders(result.db, result.user.id),
    });
  }),

  http.get(apiUrl(API_PATTERNS.orderReceipt), async ({ request, params }) => {
    const networkFailure = await applyNetworkBehavior();
    if (networkFailure) return networkFailure;

    const result = requireSession(request);
    if (!isActiveSession(result)) return result.response;

    const receipt = findReceipt(result.db, result.user.id, String(params.orderId));
    if (!receipt) {
      return notFound('O recibo fica disponivel quando o pedido e confirmado ou recusado.');
    }

    return HttpResponse.json<OrderReceipt>({
      order: receipt.order,
      issuedAt: receipt.issuedAt,
      scenario: receipt.scenario,
    });
  }),

  http.get(apiUrl(API_PATTERNS.orderById), async ({ request, params }) => {
    const networkFailure = await applyNetworkBehavior();
    if (networkFailure) return networkFailure;

    const result = requireSession(request);
    if (!isActiveSession(result)) return result.response;

    const order = findOrder(result.db, result.user.id, String(params.orderId));
    if (!order) return notFound('Pedido nao encontrado.');

    return HttpResponse.json<Order>(order);
  }),
];
