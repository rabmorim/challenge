import type { NetworkId } from '@/types/network';

/**
 * Tamanho do acervo anunciado por rede na faceta "Rede" da sidebar.
 *
 * Mesma natureza do `catalogSize` das colecoes: e o numero do
 * `design/Início.png`, declarado aqui na camada de mocks em vez de sair de uma
 * contagem do acervo semeado — o frame anuncia 283 listagens em redes contra
 * 239 em colecoes, dois totais que nenhum acervo unico produz. O filtro por
 * rede continua operando sobre os itens de verdade.
 */
export const NETWORK_CATALOG_SIZES: Record<NetworkId, number> = {
  ethereum: 119,
  polygon: 78,
  solana: 86,
};
