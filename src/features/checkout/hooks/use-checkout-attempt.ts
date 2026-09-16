import { useCallback, useEffect, useRef, useState } from 'react';

import { createIdempotencyKey } from '@/features/checkout/api/orders-api';
import {
  clearAttempt,
  readAttempt,
  writeAttempt,
} from '@/features/checkout/lib/attempt-storage';
import type {
  CheckoutAttemptApi,
  CheckoutAttemptRecord,
} from '@/features/checkout/types/checkout-state';

/**
 * Ciclo de vida da chave de idempotencia.
 *
 * **A chave nasce do corpo, nao do clique.** Uma tentativa e um corpo de pedido
 * especifico (cotacao, itens, cupom, rede, carteira e dados do colecionador);
 * a impressao digital desse corpo e o que decide se a chave e reaproveitada ou
 * se comeca outra tentativa. Isso resolve de uma vez tres exigencias do
 * enunciado que pareceriam independentes:
 *
 * - **clique repetido** — mesmo corpo, mesma chave: o servidor devolve o mesmo
 *   pedido (`200`) em vez de criar um segundo;
 * - **reenvio depois de timeout** — a chave e gravada no disco ANTES de a
 *   requisicao sair, entao ela sobrevive ao refresh e a aba fechada; reenviar
 *   recupera o pedido que talvez ja exista do outro lado;
 * - **corpo editado** — outra impressao digital, outra chave, porque
 *   reaproveitar a chave com conteudo diferente e `409`
 *   `IDEMPOTENCY_KEY_REUSED` por contrato.
 *
 * O registro e por usuario, e a troca de dono descarta o que estava em memoria:
 * chave de uma conta nunca entra na sessao de outra.
 *
 * @param userId - Dono da compra.
 * @returns Acoes de resolucao, registro e encerramento da tentativa.
 */
export function useCheckoutAttempt(userId: string): CheckoutAttemptApi {
  const [record, setRecord] = useState<CheckoutAttemptRecord | null>(() => readAttempt(userId));
  const ownerRef = useRef(userId);

  // Troca de conta: o registro do usuario anterior nao diz nada sobre esta
  // sessao, e a chave dele seria recusada pelo servidor de qualquer forma.
  useEffect(() => {
    if (ownerRef.current === userId) return;
    ownerRef.current = userId;
    setRecord(readAttempt(userId));
  }, [userId]);

  const resolveKey = useCallback(
    (fingerprint: string) => {
      const stored = readAttempt(userId);
      if (stored && stored.fingerprint === fingerprint) return stored.key;

      const next: CheckoutAttemptRecord = {
        key: createIdempotencyKey(),
        fingerprint,
        orderId: null,
        createdAt: new Date().toISOString(),
      };

      // Grava antes de a requisicao sair: se a resposta se perder, o reenvio
      // ainda encontra esta chave — e o pedido, se existir, e recuperado.
      writeAttempt(userId, next);
      setRecord(next);
      return next.key;
    },
    [userId],
  );

  const rememberOrder = useCallback(
    (orderId: string) => {
      const stored = readAttempt(userId);
      if (!stored || stored.orderId === orderId) return;

      const next: CheckoutAttemptRecord = { ...stored, orderId };
      writeAttempt(userId, next);
      setRecord(next);
    },
    [userId],
  );

  const clear = useCallback(() => {
    clearAttempt(userId);
    setRecord(null);
  }, [userId]);

  return {
    resolveKey,
    rememberOrder,
    clear,
    storedOrderId: record?.orderId ?? null,
    hasOrphanAttempt: record !== null && record.orderId === null,
  };
}
