import { CHECKOUT_STEPS } from '@/features/checkout/constants/checkout';
import type { CheckoutSearch, CheckoutStep } from '@/features/checkout/types/checkout-state';

/**
 * Parametro de busca da etapa do pagamento.
 *
 * O frame de 414 divide o pagamento em duas telas — "Perfil do colecionador" e
 * "Pagamento com carteira" — e a etapa corrente vive na URL, como o resto do
 * estado navegavel do app: assim ela sobrevive ao refresh, o botao "voltar" do
 * navegador funciona entre as etapas e um teste pode abrir a segunda direto.
 *
 * O frame de 1440 mostra as duas colunas de uma vez e ignora o parametro.
 * Valor desconhecido simplesmente desaparece: uma URL colada errada nao pode
 * derrubar a rota.
 */

/** Nome do parametro na URL. */
export const CHECKOUT_STEP_PARAM = 'etapa';

/** Etapa aberta quando a URL nao diz qual e. */
export const DEFAULT_CHECKOUT_STEP: CheckoutStep = CHECKOUT_STEPS.details;

/**
 * Verifica se o valor e uma etapa conhecida.
 *
 * @param value - Valor recebido da URL.
 * @returns `true` quando o valor e uma etapa do pagamento.
 */
export function isCheckoutStep(value: unknown): value is CheckoutStep {
  return value === CHECKOUT_STEPS.details || value === CHECKOUT_STEPS.wallet;
}

/**
 * Valida os parametros de busca da rota de pagamento.
 *
 * @param search - Parametros brutos da URL.
 * @returns Parametros validados.
 */
export function validateCheckoutSearch(search: Record<string, unknown>): CheckoutSearch {
  const step = search[CHECKOUT_STEP_PARAM];
  return isCheckoutStep(step) ? { [CHECKOUT_STEP_PARAM]: step } : {};
}
