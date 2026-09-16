import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  orderQueryOptions,
  ordersQueryOptions,
} from '@/features/checkout/api/checkout-queries';
import { createOrder } from '@/features/checkout/api/orders-api';
import { ORDER_DECLINE_LABELS } from '@/features/checkout/constants/checkout';
import { ORDER_COPY } from '@/features/checkout/constants/checkout-copy';
import { useCheckoutAttempt } from '@/features/checkout/hooks/use-checkout-attempt';
import { useOrderTracking } from '@/features/checkout/hooks/use-order-tracking';
import { fingerprintOrderRequest } from '@/features/checkout/lib/order-fingerprint';
import { buildOrderRequest } from '@/features/checkout/lib/order-request';
import type { CreateOrderRequest, Order } from '@/features/checkout/types/order';
import type {
  OrderPhase,
  OrderSubmitApi,
  OrderSubmitOptions,
} from '@/features/checkout/types/checkout-state';
import { isHttpError } from '@/lib/http';
import type { NormalizedHttpError } from '@/types/http';

/**
 * Envio do pedido — a maquina de estados da compra.
 *
 * ```
 *  idle ──submit──► submitting ──2xx──► pending ──order.updated──► confirmed
 *                        │                                      └─► declined
 *                        ├── 409 conflito ─► portao bloqueia (nenhum pedido)
 *                        ├── 422 ─────────► erros nos campos
 *                        └── timeout ─────► unknown ──reenvio da MESMA chave──► pending
 * ```
 *
 * Tres decisoes explicam o arquivo inteiro:
 *
 * - **um envio em voo.** O botao trava enquanto a mutation corre, e o guard no
 *   inicio de `submit` cobre o que o botao nao cobre (Enter repetido, clique
 *   antes do render). Mesmo que algo escape, a chave de idempotencia
 *   transforma o segundo envio em recuperacao do primeiro pedido.
 * - **timeout nao e fracasso, e incerteza.** `unknown` existe porque o pedido
 *   pode ter sido criado e so a resposta se perdeu. O caminho de saida e
 *   reenviar a MESMA tentativa — nunca comecar outra.
 * - **o cliente nao confirma nada.** O sucesso da criacao produz `pending` e
 *   para por ai; `confirmed`/`declined` chegam de `useOrderTracking`, que so os
 *   aceita do servidor.
 *
 * @param options - Cotacao, formulario, carteiras, portao e anunciador.
 * @returns Estado do pedido e as acoes de enviar, reenviar e fechar o recibo.
 */
export function useOrderSubmit({
  userId,
  quote,
  form,
  wallets,
  gate,
  announce,
}: OrderSubmitOptions): OrderSubmitApi {
  const queryClient = useQueryClient();
  const attempt = useCheckoutAttempt(userId);

  const [submittedOrderId, setSubmittedOrderId] = useState<string | null>(attempt.storedOrderId);
  const [isUnknown, setIsUnknown] = useState(false);
  const [error, setError] = useState<NormalizedHttpError | null>(null);

  /** Corpo da tentativa corrente, guardado para o reenvio depois do timeout. */
  const lastRequest = useRef<CreateOrderRequest | null>(null);

  // Retomada: uma tentativa gravada sem pedido conhecido significa que a
  // resposta se perdeu. O pedido pode existir do outro lado — o REST diz.
  const ordersQuery = useQuery({
    ...ordersQueryOptions(userId),
    enabled: submittedOrderId === null && attempt.hasOrphanAttempt,
  });

  // O pedido acompanhado sai do envio OU da retomada, derivado durante o
  // render: transformar a resposta da lista em estado exigiria um efeito que
  // teria de decidir se atropela um envio feito nesse meio-tempo.
  const resumedOrder = ordersQuery.data?.items.find(
    (candidate) => candidate.status === 'pending',
  );
  const orderId = submittedOrderId ?? resumedOrder?.id ?? null;

  const tracking = useOrderTracking(userId, orderId);

  // Gravar o pedido retomado na tentativa e um efeito colateral (escrita em
  // disco), nao estado de render — por isso continua em um efeito.
  useEffect(() => {
    if (submittedOrderId !== null || !resumedOrder) return;
    attempt.rememberOrder(resumedOrder.id);
  }, [attempt, resumedOrder, submittedOrderId]);

  /**
   * Adota o pedido devolvido pelo servidor.
   * Serve tanto para o pedido recem-criado quanto para o recuperado por
   * idempotencia — os dois chegam pelo mesmo caminho, e e assim que o reenvio
   * apos timeout termina no MESMO pedido.
   *
   * @param order - Pedido devolvido por `POST /orders`.
   */
  const adoptOrder = useCallback(
    (order: Order) => {
      attempt.rememberOrder(order.id);
      // Semear evita um piscar de "sem pedido" entre a resposta e a query.
      queryClient.setQueryData<Order>(orderQueryOptions(userId, order.id).queryKey, order);
      setIsUnknown(false);
      setError(null);
      setSubmittedOrderId(order.id);

      if (order.status === 'pending') announce(ORDER_COPY.announcePending(order.reference));
    },
    [announce, attempt, queryClient, userId],
  );

  const mutation = useMutation({
    mutationFn: ({ body, key }: { body: CreateOrderRequest; key: string }) =>
      createOrder(body, key),
    onSuccess: adoptOrder,
    onError: (cause: unknown) => {
      if (!isHttpError(cause)) return;

      // Conflito de cotacao: nenhum pedido foi criado. O portao sobe, mostra o
      // que mudou e exige nova confirmacao — e a cotacao nova muda o corpo, o
      // que rotaciona a chave sozinho.
      if (gate.blockFromError(cause)) return;

      if (cause.code === 'VALIDATION_ERROR' && cause.fieldErrors) {
        form.applyServerErrors(cause.fieldErrors);
        return;
      }

      // Sem resposta nao ha como saber se o pedido existe: e incerteza, nao
      // fracasso. A tentativa continua gravada e o reenvio a recupera.
      if (cause.code === 'TIMEOUT' || cause.code === 'NETWORK_ERROR') {
        setIsUnknown(true);
        return;
      }

      setError(cause);
    },
  });

  const { isPending: isSubmitting } = mutation;

  const submit = useCallback(() => {
    if (isSubmitting || gate.block !== null) return;
    if (tracking.phase === 'pending' || tracking.phase === 'confirmed') return;
    if (!quote) return;

    // Reenvio depois do timeout: mesmo corpo, mesma chave, mesmo pedido.
    if (isUnknown && lastRequest.current) {
      const body = lastRequest.current;
      mutation.mutate({ body, key: attempt.resolveKey(fingerprintOrderRequest(body)) });
      return;
    }

    const values = form.validate();
    const wallet = wallets.selected;
    if (!values || !wallet) return;

    const body = buildOrderRequest(quote, values, wallet.id);
    lastRequest.current = body;
    setError(null);

    mutation.mutate({ body, key: attempt.resolveKey(fingerprintOrderRequest(body)) });
  }, [attempt, form, gate.block, isSubmitting, isUnknown, mutation, quote, tracking.phase, wallets.selected]);

  const retryAfterDecline = useCallback(() => {
    // Recusa e terminal: tentar de novo e outra COMPRA, com chave propria.
    attempt.clear();
    lastRequest.current = null;
    setIsUnknown(false);
    setError(null);
    setSubmittedOrderId(null);
    mutation.reset();
  }, [attempt, mutation]);

  const dismissReceipt = useCallback(() => {
    attempt.clear();
    lastRequest.current = null;
    setSubmittedOrderId(null);
    mutation.reset();
  }, [attempt, mutation]);

  // Anuncio do desfecho: sai uma vez por pedido, na transicao para o estado
  // terminal, e nao a cada render que o encontra ja terminal.
  const announcedOrder = useRef<string | null>(null);

  useEffect(() => {
    const order = tracking.order;
    if (!order || order.status === 'pending') return;
    if (announcedOrder.current === order.id) return;

    announcedOrder.current = order.id;
    announce(
      order.status === 'confirmed'
        ? ORDER_COPY.announceConfirmed(order.reference)
        : ORDER_COPY.announceDeclined(
            ORDER_DECLINE_LABELS[order.declineReason ?? 'PAYMENT_DECLINED'],
          ),
    );
  }, [announce, tracking.order]);

  // A incerteza do timeout some sozinha quando um pedido aparece — pelo
  // reenvio da chave ou pela retomada via REST —, sem um efeito para desligá-la.
  const phase: OrderPhase = isSubmitting
    ? 'submitting'
    : isUnknown && orderId === null
      ? 'unknown'
      : tracking.phase;

  return {
    phase,
    order: tracking.order,
    receipt: tracking.receipt,
    isReceiptPending: tracking.isReceiptPending,
    isSubmitting,
    error,
    submit,
    retryAfterDecline,
    dismissReceipt,
  };
}
