import type { CreateOrderRequest } from '@/features/checkout/types/order';

/**
 * Impressao digital do corpo do pedido.
 *
 * E ela que define o que e "a mesma tentativa": a chave de idempotencia nasce
 * do CORPO, nao do clique. Mesmo corpo — retry depois de timeout, clique
 * repetido, reenvio apos refresh — reusa a chave e recupera o mesmo pedido;
 * corpo diferente comeca outra tentativa, porque o servidor responde `409`
 * `IDEMPOTENCY_KEY_REUSED` para chave reaproveitada com conteudo diferente.
 *
 * A serializacao normaliza a ordem: as chaves saem ordenadas e os itens vao
 * por `nftId`, para que duas leituras do mesmo pedido em ordens diferentes
 * produzam a mesma impressao.
 */

/** Base do hash textual (primo pequeno, padrao FNV-1a de 32 bits). */
const FNV_OFFSET = 0x811c9dc5;

/** Multiplicador do FNV-1a de 32 bits. */
const FNV_PRIME = 0x01000193;

/**
 * Serializa um valor com as chaves em ordem estavel.
 *
 * @param value - Valor a serializar.
 * @returns JSON canonico do valor.
 */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;

  const entries = Object.entries(value as Record<string, unknown>)
    .toSorted(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`);

  return `{${entries.join(',')}}`;
}

/**
 * Calcula a impressao digital do corpo de um pedido.
 *
 * @param request - Corpo que sera enviado a `POST /orders`.
 * @returns Impressao digital em hexadecimal de 8 caracteres.
 */
export function fingerprintOrderRequest(request: CreateOrderRequest): string {
  const canonical = stableStringify({
    ...request,
    items: request.items.toSorted((left, right) => left.nftId.localeCompare(right.nftId)),
  });

  let hash = FNV_OFFSET;
  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
}
