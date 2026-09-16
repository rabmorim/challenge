import type { AppliedCoupon, Quote } from '@/features/checkout/types/quote';
import type { NormalizedHttpError } from '@/types/http';
import type { NetworkId } from '@/types/network';

/**
 * Resumo de valores derivado da cotacao da API.
 *
 * O tipo vive aqui, e nao no carrinho, porque as duas telas leem a MESMA coisa:
 * o carrinho mostra o resumo com a taxa estimada da rede padrao, o pagamento
 * mostra o mesmo resumo com a rede escolhida. Um tipo por tela viraria duas
 * implementacoes do mesmo contrato.
 */

/** Opcoes de `useQuoteSummary`. */
export interface QuoteSummaryOptions {
  /** Dono do cache (id do usuario, ou `guest` no carrinho de visitante). */
  owner: string;
  /**
   * Rede escolhida; `null` usa a rede padrao do servidor.
   * O carrinho passa `null` — e por isso que o frame chama a linha de "Taxa
   * estimada": a rede definitiva so e escolhida no pagamento.
   */
  network: NetworkId | null;
}

/** Estado do resumo de valores e as acoes de cupom. */
export interface QuoteSummaryApi {
  /** Cotacao corrente; `null` enquanto nao houve nenhuma. */
  quote: Quote | null;
  /** Primeira cotacao: o resumo mostra esqueleto. */
  isPending: boolean;
  /** Recotando com um resumo anterior na tela (sem deslocar layout). */
  isUpdating: boolean;
  isError: boolean;
  error: NormalizedHttpError | null;
  /** Cupom aceito pelo servidor, como ele o devolveu. */
  coupon: AppliedCoupon | null;
  /** Mensagem de recusa do cupom, associada ao campo. */
  couponError: string | null;
  /** Envio do cupom em voo — trava o botao contra duplo submit. */
  isApplyingCoupon: boolean;
  /**
   * Envia um codigo promocional para validacao do servidor.
   *
   * @param code - Codigo digitado pelo usuario.
   */
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;
  refetch: () => void;
}
