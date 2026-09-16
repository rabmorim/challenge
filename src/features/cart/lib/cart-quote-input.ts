import type { CartItem } from '@/features/cart/types/cart';
import type { QuoteSignatureEntry } from '@/features/cart/types/cart-state';
import type { QuoteItemInput } from '@/features/checkout/types/quote';

/**
 * Entrada da cotacao do carrinho.
 *
 * A assinatura reune tudo que, mudando, torna a cotacao anterior obsoleta:
 * quais NFTs, em que quantidade e em que **versao** do catalogo. Ela vai na
 * query key, e e dai que vem o "latest-wins" sem comparar carimbo de tempo:
 * assinaturas diferentes sao entradas de cache diferentes, entao uma resposta
 * atrasada so tem onde aterrissar na chave que a pediu. A versao entra de
 * proposito — quando um `nft.updated` muda preco ou disponibilidade de uma
 * linha, a chave muda junto e a recotagem acontece por construcao.
 *
 * A ordem e normalizada porque duas leituras do mesmo carrinho em ordens
 * diferentes sao a mesma cotacao: sem isso o cache se dividiria sem motivo.
 */

/**
 * Monta a assinatura dos itens do carrinho.
 *
 * @param items - Linhas do carrinho, como a API as devolveu.
 * @returns Assinatura estavel, ordenada pelo id do NFT.
 */
export function toQuoteSignature(items: readonly CartItem[]): QuoteSignatureEntry[] {
  return items
    .map((item) => ({
      nftId: item.nftId,
      quantity: item.quantity,
      nftVersion: item.nftVersion,
    }))
    .toSorted((left, right) => left.nftId.localeCompare(right.nftId));
}

/**
 * Converte a assinatura no corpo aceito por `POST /quotes`.
 * A versao fica de fora: ela identifica a cotacao, mas quem a confere e o
 * servidor, contra o proprio catalogo.
 *
 * @param signature - Assinatura dos itens.
 * @returns Itens no formato do contrato da cotacao.
 */
export function toQuoteItems(signature: readonly QuoteSignatureEntry[]): QuoteItemInput[] {
  return signature.map(({ nftId, quantity }) => ({ nftId, quantity }));
}
