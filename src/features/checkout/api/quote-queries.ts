import { keepPreviousData, queryOptions } from '@tanstack/react-query';

import { toQuoteItems } from '@/features/cart/lib/cart-quote-input';
import type { QuoteSignatureEntry } from '@/features/cart/types/cart-state';
import { createQuote } from '@/features/checkout/api/quotes-api';
import { CHECKOUT_QUERY_SEGMENTS } from '@/features/checkout/constants/checkout';
import { queryKeys } from '@/lib/query-keys';
import type { NetworkId } from '@/types/network';

/**
 * Query do resumo de valores (subtotal, desconto, taxa de rede e total).
 *
 * E uma **query**, e nao uma mutation, apesar de o transporte ser `POST`: o
 * resumo e uma leitura derivada do carrinho, e modela-lo como query entrega
 * tres coisas de graca —
 *
 * 1. **descarte do obsoleto por construcao**: a assinatura dos itens esta na
 *    chave, entao uma cotacao atrasada so pode aterrissar na chave que a pediu,
 *    nunca por cima do resumo atual (latest-wins sem comparar carimbo de tempo);
 * 2. **cancelamento real**: o `signal` chega ao Axios e aborta a cotacao
 *    anterior em vez de apenas ignora-la;
 * 3. **recotagem sem piscar**: `keepPreviousData` mantem o resumo anterior na
 *    tela enquanto o novo chega, marcado como "atualizando" — sem esqueleto no
 *    meio da interacao e sem deslocar layout.
 *
 * A **rede** entra na chave porque a taxa depende dela: trocar de rede no
 * pagamento precisa produzir outra cotacao, nunca um total remendado no
 * cliente. O carrinho passa `null` e fica com a rede padrao do servidor — sao
 * entradas de cache diferentes de proposito, porque sao corpos diferentes.
 *
 * `staleTime` zero e deliberado e contraria o padrao do projeto: uma cotacao e
 * um instantaneo de preco com validade, entao reaproveita-la como "fresca"
 * seria exibir um total que o servidor talvez ja nao honre.
 *
 * @param owner - Id do usuario, ou `GUEST_CART_OWNER` para visitante.
 * @param signature - Assinatura dos itens (id, quantidade e versao do NFT).
 * @param couponCode - Cupom aplicado, ou `null` para cotar sem cupom.
 * @param network - Rede escolhida, ou `null` para a rede padrao do servidor.
 * @returns Opcoes da query da cotacao.
 */
export function quoteQueryOptions(
  owner: string,
  signature: QuoteSignatureEntry[],
  couponCode: string | null,
  network: NetworkId | null,
) {
  return queryOptions({
    queryKey: queryKeys.private(owner, CHECKOUT_QUERY_SEGMENTS.quote, {
      couponCode,
      network,
      items: signature,
    }),
    queryFn: ({ signal }) =>
      createQuote(
        { items: toQuoteItems(signature), couponCode, ...(network ? { network } : {}) },
        signal,
      ),
    // Carrinho vazio nao tem o que cotar: o servidor responderia `EMPTY_CART`,
    // que e uma validacao legitima da API, nao um estado da tela.
    enabled: signature.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
}
