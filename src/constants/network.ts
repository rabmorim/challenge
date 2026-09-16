import type { NetworkId, NetworkInfo } from '@/types/network';

/**
 * Rede pre-selecionada no pagamento enquanto nao ha carteira escolhida.
 * Espelha a rede padrao do servidor simulado na cotacao: com as duas iguais, a
 * primeira cotacao da tela nao muda de valor assim que a carteira carrega.
 */
export const DEFAULT_CHECKOUT_NETWORK: NetworkId = 'ethereum';

/** Ordem canonica das redes — usada em filtros e seletores. */
export const NETWORK_IDS: readonly NetworkId[] = ['ethereum', 'polygon', 'solana'] as const;

/** Metadados de exibicao de cada rede. */
export const NETWORKS: Record<NetworkId, NetworkInfo> = {
  ethereum: { id: 'ethereum', label: 'Ethereum', symbol: 'ETH' },
  polygon: { id: 'polygon', label: 'Polygon', symbol: 'ETH' },
  solana: { id: 'solana', label: 'Solana', symbol: 'ETH' },
};

/**
 * Type guard para validar um valor vindo da URL ou de um formulario.
 *
 * @param value - Valor de origem desconhecida.
 * @returns `true` quando o valor e um `NetworkId` conhecido.
 */
export function isNetworkId(value: unknown): value is NetworkId {
  return typeof value === 'string' && (NETWORK_IDS as readonly string[]).includes(value);
}
