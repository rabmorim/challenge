/**
 * Redes de blockchain simuladas. Compartilhadas por catalogo (filtro),
 * carteiras (rede da carteira) e cotacao (taxa de rede), por isso vivem em
 * `src/types` e nao dentro de uma feature.
 */

/** Identificador estavel de uma rede. */
export type NetworkId = 'ethereum' | 'polygon' | 'solana';

/** Rede pronta para exibicao (rotulo e simbolo vem da API/constantes). */
export interface NetworkInfo {
  id: NetworkId;
  /** Nome exibido na interface. */
  label: string;
  /** Simbolo do token nativo, ex.: `ETH`. */
  symbol: string;
}
