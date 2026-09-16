import { HttpResponse, http, type HttpHandler } from 'msw';

import { API_PATTERNS } from '@/constants/api';
import type { Quote, QuoteRequest } from '@/features/checkout/types/quote';
import { percentageOfEth, quantizeEth, sumEth } from '@/lib/eth';
import { updateNftMarket } from '@/mocks/db/nfts';
import { computeQuote } from '@/mocks/db/pricing';
import { getDatabase } from '@/mocks/db/store';
import { apiUrl, isResolvedOwner, readJsonBody, requireOwner } from '@/mocks/handlers/shared';
import { conflict, errorResponse, validationError } from '@/mocks/lib/responses';
import { getActiveScenario } from '@/mocks/scenarios/active';
import { applyNetworkBehavior } from '@/mocks/scenarios/network';
import type { QuoteFailure } from '@/mocks/types/pricing';
import type { MockDatabase } from '@/mocks/types/db';

/**
 * Cotacao: valida cupom e disponibilidade e calcula descontos, taxas e total.
 *
 * O servidor simulado e a referencia dos valores; o cliente nunca soma nada.
 * Aceita visitante (o resumo do carrinho existe antes do login), mas o pedido
 * exige sessao.
 */

/** Percentual de aumento aplicado pelo cenario de "preco alterado". */
const PRICE_DRIFT_PERCENT = '12';

/**
 * Se a mudanca pos-cotacao ja aconteceu no cenario em vigor.
 *
 * A mudanca acontece UMA vez, e nao a cada cotacao, porque a tela recotiza
 * sozinha quando o preco muda (a versao do NFT faz parte da assinatura da
 * cotacao). Repetir o desvio a cada resposta produziria uma escalada sem fim —
 * cotacao, evento, nova cotacao, novo evento — e o resumo nunca assentaria. Uma
 * vez basta para o pedido seguinte cair em conflito, que e o que o cenario
 * existe para provar.
 */
let driftApplied = false;

/** Zera o desvio pos-cotacao — chamado pelo reset e pela troca de cenario. */
export function resetQuoteDrift(): void {
  driftApplied = false;
}

/**
 * Traduz a falha da cotacao no erro HTTP correspondente.
 *
 * @param failure - Falha devolvida pelo calculo.
 * @returns Resposta de erro no envelope padrao.
 */
function toQuoteErrorResponse(failure: QuoteFailure): Response {
  if (failure.conflicts) {
    return conflict(failure.reason, failure.message, failure.conflicts);
  }

  if (failure.field) {
    return errorResponse('VALIDATION_ERROR', failure.message, {
      reason: failure.reason,
      fieldErrors: { [failure.field]: failure.message },
    });
  }

  if (failure.reason === 'EMPTY_CART') return validationError({ items: failure.message }, failure.message);

  return conflict(failure.reason, failure.message);
}

/**
 * Aplica a mudanca de mercado que o cenario pede logo depois de cotar.
 *
 * A mudanca acontece de verdade no store (sobe a versao e emite `nft.updated`),
 * entao a interface e avisada em tempo real e o pedido subsequente cai em
 * conflito — que e exatamente o cenario do enunciado §7. Acontece uma unica vez
 * por cenario aplicado (ver `driftApplied`).
 *
 * @param db - Estado do servidor simulado.
 * @param quote - Cotacao recem-criada.
 */
function applyPostQuoteDrift(db: MockDatabase, quote: Quote): void {
  if (driftApplied) return;

  const { checkout } = getActiveScenario();
  const line = quote.lines[0];
  if (!line) return;

  const nft = db.nfts.find((candidate) => candidate.id === line.nftId);
  if (!nft) return;

  if (checkout.priceDriftAfterQuote) {
    driftApplied = true;
    updateNftMarket(nft, {
      price: quantizeEth(sumEth([nft.price, percentageOfEth(nft.price, PRICE_DRIFT_PERCENT)]), 2),
    });
    return;
  }

  if (checkout.soldOutAfterQuote) {
    driftApplied = true;
    updateNftMarket(nft, { available: 0 });
  }
}

/** Handler da cotacao. */
export const quoteHandlers: HttpHandler[] = [
  http.post(apiUrl(API_PATTERNS.quotes), async ({ request }) => {
    const failure = await applyNetworkBehavior();
    if (failure) return failure;

    const result = requireOwner(request);
    if (!isResolvedOwner(result)) return result.response;

    const body = await readJsonBody<QuoteRequest>(request);
    if (!body || !Array.isArray(body.items)) {
      return validationError({ items: 'Informe os itens a cotar.' });
    }

    const db = getDatabase();
    const quoted = computeQuote(db, result.ownerId, body);

    if (!quoted.ok) return toQuoteErrorResponse(quoted.failure);

    applyPostQuoteDrift(db, quoted.quote);

    return HttpResponse.json<Quote>(quoted.quote);
  }),
];
