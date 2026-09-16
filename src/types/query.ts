/** Tipos de apoio a fabrica de query keys (`src/lib/query-keys.ts`). */

/**
 * Segmento aceito em uma query key.
 *
 * Parametros de consulta entram como objeto — o TanStack Query serializa de
 * forma estavel, entao a ordem das chaves nao muda a identidade da key. O tipo
 * e `object` (e nao `Record<string, unknown>`) porque uma `interface` declarada
 * nao casa com o indice de string: os contratos de parametros do catalogo sao
 * interfaces e precisam entrar na key como estao, sem copia intermediaria.
 */
export type QueryKeyPart = string | number | boolean | null | object;
