import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import { toQuoteItems, toQuoteSignature } from '@/features/cart/lib/cart-quote-input';
import { toCouponError } from '@/features/cart/lib/coupon-errors';
import type { CartItem } from '@/features/cart/types/cart';
import { quoteQueryOptions } from '@/features/checkout/api/quote-queries';
import { createQuote } from '@/features/checkout/api/quotes-api';
import type { Quote } from '@/features/checkout/types/quote';
import type {
  QuoteSummaryApi,
  QuoteSummaryOptions,
} from '@/features/checkout/types/quote-summary';
import { isHttpError } from '@/lib/http';

/**
 * Resumo de valores — sempre derivado da cotação da API.
 *
 * O cliente não soma nada: subtotal, desconto do lançamento, taxa de rede e
 * total são exibidos como o servidor os devolveu, em string decimal. O que este
 * hook faz é manter a cotação **correspondente ao que está na tela** — e é por
 * isso que a assinatura dos itens (id, quantidade e versão do NFT) vive na
 * query key: qualquer alteração, venha de uma mutation ou de um `nft.updated`,
 * produz outra chave e a recotagem acontece por construção, com o resumo
 * anterior visível e marcado como "atualizando" enquanto isso.
 *
 * É o mesmo hook nas duas telas porque é a mesma leitura: o carrinho cotiza sem
 * escolher rede (daí a nota "Taxa estimada" do frame) e o pagamento cotiza com
 * a rede selecionada, que muda a taxa. A diferença cabe inteira em um parâmetro.
 *
 * **O cupom é uma mutation, o resumo é uma query.** São papéis diferentes:
 * "tentar este código" é uma ação com sucesso ou recusa, e uma recusa não pode
 * apagar o resumo que já estava correto. Então o código só entra na chave da
 * query depois de o servidor aceitá-lo — a resposta da mutation é semeada na
 * chave nova, o que troca o resumo sem uma segunda ida à rede. Código recusado
 * vira mensagem no campo e mais nada muda.
 *
 * @param items - Linhas em compra, como a API as devolveu.
 * @param options - Dono do cache e rede escolhida (`null` usa a padrão).
 * @returns Cotação corrente, estado do cupom e as ações de aplicar/remover.
 */
export function useQuoteSummary(
  items: readonly CartItem[],
  { owner, network }: QuoteSummaryOptions,
): QuoteSummaryApi {
  const queryClient = useQueryClient();

  /** Código já aceito pelo servidor, na forma canônica que ele devolveu. */
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const signature = useMemo(() => toQuoteSignature(items), [items]);
  const query = useQuery(quoteQueryOptions(owner, signature, appliedCode, network));

  const couponMutation = useMutation({
    mutationFn: (code: string) =>
      createQuote({
        items: toQuoteItems(signature),
        couponCode: code,
        ...(network ? { network } : {}),
      }),

    onSuccess: (quote) => {
      // O servidor normaliza o código (caixa e espaços); adotar a forma dele
      // mantém a chave da query canônica — dois jeitos de digitar o mesmo
      // cupom não podem virar duas entradas de cache.
      const accepted = quote.coupon?.code ?? null;
      queryClient.setQueryData<Quote>(
        quoteQueryOptions(owner, signature, accepted, network).queryKey,
        quote,
      );
      setSubmitError(null);
      setAppliedCode(accepted);
    },

    onError: (error: unknown) => {
      // Cupom recusado não derruba o resumo: a cotação em vigor continua sendo
      // a do carrinho sem cupom (ou com o cupom anterior), que está correta.
      setSubmitError(toCouponError(error) ?? (isHttpError(error) ? error.message : null));
    },
  });

  const applyCoupon = useCallback(
    (code: string) => {
      const trimmed = code.trim();
      if (trimmed.length === 0 || couponMutation.isPending) return;
      couponMutation.mutate(trimmed);
    },
    [couponMutation],
  );

  const removeCoupon = useCallback(() => {
    setSubmitError(null);
    setAppliedCode(null);
  }, []);

  // Um cupom aceito pode deixar de valer quando o carrinho muda (subtotal
  // abaixo do mínimo, última linha da coleção removida): aí a recusa vem pela
  // query, e não pela mutation, mas pertence ao mesmo campo.
  const couponError = submitError ?? toCouponError(query.error);

  return {
    quote: query.data ?? null,
    isPending: query.isPending && signature.length > 0,
    isUpdating: query.isFetching && !query.isPending,
    isError: query.isError,
    error: isHttpError(query.error) ? query.error : null,
    coupon: query.data?.coupon ?? null,
    couponError,
    isApplyingCoupon: couponMutation.isPending,
    applyCoupon,
    removeCoupon,
    refetch: () => {
      void query.refetch();
    },
  };
}
