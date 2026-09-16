import type {
  AppliedCoupon,
  Quote,
  QuoteLine,
  QuoteRequest,
} from '@/features/checkout/types/quote';
import { multiplyEth, percentageOfEth, quantizeEth, subtractEth, sumEth } from '@/lib/eth';
import { NETWORK_FEES, QUOTE_TTL_MS } from '@/mocks/constants';
import { commitDatabase } from '@/mocks/db/store';
import { fingerprint } from '@/mocks/lib/hash';
import { createQuoteId } from '@/mocks/lib/ids';
import type { CouponRecord, MockDatabase, NftRecord, QuoteRecord } from '@/mocks/types/db';
import type { QuoteFailure, QuoteResult } from '@/mocks/types/pricing';
import type { AvailabilityConflict, EthAmount } from '@/types/api';
import type { NetworkId } from '@/types/network';

/**
 * Cotacao no servidor simulado — a referencia dos valores da compra.
 *
 * O cliente nunca soma nada: subtotal, desconto, taxa de rede e total saem
 * daqui como strings decimais. A cotacao guarda a assinatura dos precos e
 * versoes cotados, e a criacao do pedido recusa qualquer divergencia.
 */

/** Rede usada quando o cliente nao escolheu nenhuma. */
const DEFAULT_NETWORK: NetworkId = 'ethereum';

/**
 * Encontra um cupom pelo codigo, ignorando caixa e espacos.
 *
 * @param db - Estado do servidor simulado.
 * @param code - Codigo digitado pelo usuario.
 * @returns Cupom ou `undefined`.
 */
function findCoupon(db: MockDatabase, code: string): CouponRecord | undefined {
  const normalized = code.trim().toUpperCase();
  return db.coupons.find((coupon) => coupon.code === normalized);
}

/**
 * Monta o registro de divergencia de um item.
 *
 * @param nft - NFT com os valores atuais.
 * @param requestedQuantity - Quantidade pedida pelo cliente.
 * @param quotedPrice - Preco que o cliente tinha na cotacao.
 * @returns Conflito no formato do contrato de erro.
 */
export function toAvailabilityConflict(
  nft: NftRecord,
  requestedQuantity: number,
  quotedPrice: EthAmount,
): AvailabilityConflict {
  return {
    nftId: nft.id,
    name: nft.name,
    quotedPrice,
    currentPrice: nft.price,
    requestedQuantity,
    availableQuantity: nft.edition.available,
    version: nft.version,
  };
}

/**
 * Valida o cupom contra o subtotal e as colecoes do carrinho.
 *
 * @param coupon - Cupom encontrado.
 * @param subtotal - Subtotal ja calculado.
 * @param eligibleSubtotal - Parte do subtotal coberta pela restricao de colecao.
 * @returns Falha de validacao ou `null` quando o cupom vale.
 */
function validateCoupon(
  coupon: CouponRecord,
  subtotal: EthAmount,
  eligibleSubtotal: EthAmount,
): QuoteFailure | null {
  if (coupon.expiresAt && Date.parse(coupon.expiresAt) <= Date.now()) {
    return {
      reason: 'COUPON_EXPIRED',
      message: `O cupom ${coupon.code} expirou.`,
      field: 'couponCode',
    };
  }

  if (coupon.minSubtotal && Number(subtotal) < Number(coupon.minSubtotal)) {
    return {
      reason: 'COUPON_NOT_APPLICABLE',
      message: `O cupom ${coupon.code} exige subtotal minimo de ${coupon.minSubtotal} ETH.`,
      field: 'couponCode',
    };
  }

  if (coupon.collectionIds && Number(eligibleSubtotal) === 0) {
    return {
      reason: 'COUPON_NOT_APPLICABLE',
      message: `O cupom ${coupon.code} vale apenas para colecoes especificas.`,
      field: 'couponCode',
    };
  }

  return null;
}

/**
 * Calcula a taxa de rede: parte fixa da rede mais parte por unidade comprada.
 *
 * @param network - Rede escolhida.
 * @param totalQuantity - Soma das quantidades.
 * @returns Taxa em ETH.
 */
function computeNetworkFee(network: NetworkId, totalQuantity: number): EthAmount {
  const fee = NETWORK_FEES[network];
  return quantizeEth(sumEth([fee.base, multiplyEth(fee.perItem, totalQuantity)]));
}

/**
 * Calcula a assinatura dos precos cotados.
 * Entra tudo que, mudando, invalida a cotacao: item, versao, preco, quantidade,
 * cupom aplicado e rede.
 *
 * @param lines - Linhas da cotacao.
 * @param couponCode - Cupom aplicado, se houver.
 * @param network - Rede escolhida.
 * @returns Assinatura estavel.
 */
export function computePricingSignature(
  lines: QuoteLine[],
  couponCode: string | null,
  network: NetworkId,
): string {
  return fingerprint({
    network,
    couponCode,
    lines: lines.map((line) => ({
      nftId: line.nftId,
      version: line.nftVersion,
      price: line.unitPrice,
      quantity: line.quantity,
    })),
  });
}

/**
 * Calcula uma cotacao e a registra no store.
 *
 * Valida itens, quantidades, disponibilidade e cupom; qualquer problema volta
 * como falha tipada, com os conflitos que a interface precisa exibir.
 *
 * @param db - Estado do servidor simulado.
 * @param ownerId - Dono da cotacao (usuario ou visitante).
 * @param request - Itens, cupom e rede pedidos.
 * @returns Cotacao registrada ou a falha correspondente.
 */
export function computeQuote(db: MockDatabase, ownerId: string, request: QuoteRequest): QuoteResult {
  if (request.items.length === 0) {
    return {
      ok: false,
      failure: { reason: 'EMPTY_CART', message: 'Adicione itens ao carrinho para continuar.' },
    };
  }

  const network = request.network ?? DEFAULT_NETWORK;
  const lines: QuoteLine[] = [];
  const conflicts: AvailabilityConflict[] = [];
  let limitExceeded = false;

  for (const item of request.items) {
    const nft = db.nfts.find((candidate) => candidate.id === item.nftId);

    if (!nft) {
      return {
        ok: false,
        failure: {
          reason: 'QUOTE_STALE',
          message: 'Um dos itens nao esta mais disponivel no catalogo.',
        },
      };
    }

    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      return {
        ok: false,
        failure: {
          reason: 'QUANTITY_ABOVE_LIMIT',
          message: 'Quantidade invalida: informe um numero inteiro maior que zero.',
          field: 'quantity',
        },
      };
    }

    if (item.quantity > nft.edition.maxPerOrder) {
      limitExceeded = true;
      conflicts.push(toAvailabilityConflict(nft, item.quantity, nft.price));
      continue;
    }

    if (item.quantity > nft.edition.available) {
      conflicts.push(toAvailabilityConflict(nft, item.quantity, nft.price));
      continue;
    }

    lines.push({
      nftId: nft.id,
      name: nft.name,
      imageUrl: nft.imageUrl,
      unitPrice: nft.price,
      quantity: item.quantity,
      lineTotal: multiplyEth(nft.price, item.quantity),
      available: nft.edition.available,
      nftVersion: nft.version,
    });
  }

  if (conflicts.length > 0) {
    return {
      ok: false,
      failure: {
        reason: limitExceeded ? 'QUANTITY_ABOVE_LIMIT' : 'EDITION_SOLD_OUT',
        message: limitExceeded
          ? 'A quantidade pedida passa do limite por pedido.'
          : 'A disponibilidade de um dos itens mudou.',
        conflicts,
      },
    };
  }

  const subtotal = quantizeEth(sumEth(lines.map((line) => line.lineTotal)));
  const totalQuantity = lines.reduce((total, line) => total + line.quantity, 0);

  let coupon: AppliedCoupon | null = null;
  let discount = '0';

  if (request.couponCode) {
    const record = findCoupon(db, request.couponCode);

    if (!record) {
      return {
        ok: false,
        failure: {
          reason: 'COUPON_NOT_FOUND',
          message: 'Cupom nao encontrado.',
          field: 'couponCode',
        },
      };
    }

    const eligibleSubtotal = quantizeEth(
      sumEth(
        lines
          .filter((line) => {
            if (!record.collectionIds) return true;
            const nft = db.nfts.find((candidate) => candidate.id === line.nftId);
            return nft ? record.collectionIds.includes(nft.collectionId) : false;
          })
          .map((line) => line.lineTotal),
      ),
    );

    const failure = validateCoupon(record, subtotal, eligibleSubtotal);
    if (failure) return { ok: false, failure };

    discount = quantizeEth(percentageOfEth(eligibleSubtotal, record.percentOff));
    coupon = { code: record.code, label: record.label, percentOff: record.percentOff, discount };
  }

  const networkFee = computeNetworkFee(network, totalQuantity);
  const createdAt = new Date();

  const record: QuoteRecord = {
    ownerId,
    id: createQuoteId(),
    version: 1,
    network,
    lines,
    subtotal,
    discount,
    networkFee,
    total: quantizeEth(sumEth([subtractEth(subtotal, discount), networkFee])),
    coupon,
    expiresAt: new Date(createdAt.getTime() + QUOTE_TTL_MS).toISOString(),
    pricingSignature: computePricingSignature(lines, coupon?.code ?? null, network),
    createdAt: createdAt.toISOString(),
  };

  db.quotes.push(record);
  commitDatabase();

  return { ok: true, quote: toQuote(record) };
}

/**
 * Remove o dono da cotacao antes de publicar.
 *
 * @param record - Cotacao persistida.
 * @returns Cotacao no formato do contrato.
 */
export function toQuote(record: QuoteRecord): Quote {
  const { ownerId: _ownerId, ...quote } = record;
  return quote;
}

/**
 * Encontra a cotacao de um dono.
 * Cotacao de outro dono nunca e encontrada — isolamento por usuario tambem aqui.
 *
 * @param db - Estado do servidor simulado.
 * @param ownerId - Dono da cotacao.
 * @param quoteId - Id da cotacao.
 * @returns Cotacao ou `undefined`.
 */
export function findQuote(
  db: MockDatabase,
  ownerId: string,
  quoteId: string,
): QuoteRecord | undefined {
  return db.quotes.find((quote) => quote.id === quoteId && quote.ownerId === ownerId);
}
