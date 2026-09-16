/**
 * Hash estavel usado para impressoes digitais da simulacao (assinatura de
 * precos de uma cotacao e impressao do corpo de um pedido idempotente).
 * FNV-1a de 32 bits: rapido, sem dependencia e determinístico entre execucoes.
 */

/** Offset inicial do FNV-1a de 32 bits. */
const FNV_OFFSET_BASIS = 0x811c9dc5;

/** Primo do FNV-1a de 32 bits. */
const FNV_PRIME = 0x01000193;

/**
 * Calcula o hash de um texto.
 *
 * @param input - Texto a resumir.
 * @returns Hash hexadecimal de 8 caracteres.
 */
export function stableHash(input: string): string {
  let hash = FNV_OFFSET_BASIS;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Serializa um valor de forma estavel (chaves em ordem alfabetica) e calcula o
 * hash. E o que permite comparar dois corpos de requisicao sem depender da
 * ordem em que o cliente montou o JSON.
 *
 * @param value - Valor serializavel.
 * @returns Hash hexadecimal do valor.
 */
export function fingerprint(value: unknown): string {
  return stableHash(stringifyStable(value));
}

/**
 * Serializa um valor com as chaves de objeto ordenadas.
 *
 * @param value - Valor serializavel.
 * @returns JSON estavel.
 */
function stringifyStable(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';

  if (Array.isArray(value)) {
    return `[${value.map((item) => stringifyStable(item)).join(',')}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .toSorted(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${stringifyStable(item)}`);

  return `{${entries.join(',')}}`;
}
