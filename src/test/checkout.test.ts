import { describe, expect, it, vi } from 'vitest';

import { login } from '@/features/auth/api/auth-api';
import { addCartItem, fetchCart } from '@/features/cart/api/cart-api';
import { fetchNft } from '@/features/catalog/api/nfts-api';
import {
  createIdempotencyKey,
  createOrder,
  fetchOrder,
  fetchOrderReceipt,
} from '@/features/checkout/api/orders-api';
import { createQuote } from '@/features/checkout/api/quotes-api';
import type { CollectorDetails, CreateOrderRequest } from '@/features/checkout/types/order';
import type { Quote } from '@/features/checkout/types/quote';
import { updateWallet } from '@/features/wallets/api/wallets-api';
import { selectScenario } from '@/test/mock-control';

/**
 * Cotacao e pedido: valores calculados pelo servidor, cupons, revalidacao antes
 * de confirmar, idempotencia e resolucao do pagamento pela simulacao.
 */

/** Dados do colecionador usados nos pedidos de teste (campos do frame). */
const COLLECTOR: CollectorDetails = {
  displayName: 'Ana Ribeiro',
  username: 'ana.colecionadora',
  profileName: 'Acervo Ribeiro',
  email: 'ana@kurio.dev',
  walletAddress: '0xA91F7c3b0d5e2481a6f09c4b7d3e150f9a26E82C',
  secondaryWallet: null,
  referralCode: 'KURIO-ANA',
  ensDomain: '.eth',
  usesAlternateWallet: false,
  note: null,
};

/** Carteira principal semeada da Ana. */
const WALLET_ID = 'wallet-ana-primary';

/** NFT usado nas compras de teste (limite de 3 por pedido, 12 disponiveis). */
const NFT_ID = 'emerald-ape-042';

/** Quantidade comprada nos testes. */
const QUANTITY = 2;

/**
 * Autentica e cotiza os itens.
 *
 * A cotacao nao depende do carrinho de proposito: assim um teste pode cotar
 * mais de uma vez (cupom invalido, depois expirado) sem empilhar unidades e
 * bater no limite por pedido.
 *
 * @param couponCode - Cupom a aplicar, quando houver.
 * @returns Cotacao devolvida pelo servidor.
 */
async function prepareQuote(couponCode: string | null = null): Promise<Quote> {
  await login({ email: 'ana@kurio.dev', password: 'kurio1234' });

  return createQuote({
    items: [{ nftId: NFT_ID, quantity: QUANTITY }],
    couponCode,
    network: 'ethereum',
  });
}

/**
 * Monta o corpo do pedido a partir de uma cotacao.
 *
 * @param quote - Cotacao aprovada.
 * @returns Corpo pronto para `createOrder`.
 */
function toOrderRequest(quote: Quote): CreateOrderRequest {
  return {
    quoteId: quote.id,
    pricingSignature: quote.pricingSignature,
    items: quote.lines.map((line) => ({ nftId: line.nftId, quantity: line.quantity })),
    couponCode: quote.coupon?.code ?? null,
    network: quote.network,
    walletId: WALLET_ID,
    collector: COLLECTOR,
  };
}

describe('cotacao', () => {
  it('calcula subtotal, taxa de rede e total como strings decimais', async () => {
    const quote = await prepareQuote();

    expect(quote.subtotal).toBe('2.38');
    expect(quote.discount).toBe('0');
    // Ethereum: 0.0042 fixo + 0.0009 por unidade (2 unidades).
    expect(quote.networkFee).toBe('0.006');
    expect(quote.total).toBe('2.386');
    expect(quote.pricingSignature).toMatch(/^[0-9a-f]{8}$/);
  });

  it('aplica cupom valido', async () => {
    const quote = await prepareQuote('KURIO10');

    expect(quote.coupon).toMatchObject({ code: 'KURIO10', percentOff: '10' });
    expect(quote.discount).toBe('0.238');
    expect(quote.total).toBe('2.148');
  });

  it('recusa cupom inexistente e cupom expirado', async () => {
    await expect(prepareQuote('NAOEXISTE')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      reason: 'COUPON_NOT_FOUND',
      fieldErrors: { couponCode: expect.stringContaining('nao encontrado') },
    });

    await expect(prepareQuote('GENESIS20')).rejects.toMatchObject({ reason: 'COUPON_EXPIRED' });
  });

  it('recusa cupom nao aplicavel a colecao do carrinho', async () => {
    await login({ email: 'ana@kurio.dev', password: 'kurio1234' });
    await addCartItem({ nftId: 'golden-beat-207', quantity: 1 });
    const cart = await fetchCart();

    await expect(
      createQuote({
        items: cart.items.map((item) => ({ nftId: item.nftId, quantity: item.quantity })),
        couponCode: 'ARTE15',
      }),
    ).rejects.toMatchObject({ reason: 'COUPON_NOT_APPLICABLE' });
  });
});

describe('pedido', () => {
  it('cria o pedido pendente e o confirma pela simulacao', async () => {
    const quote = await prepareQuote();
    await addCartItem({ nftId: NFT_ID, quantity: QUANTITY });
    const order = await createOrder(toOrderRequest(quote), createIdempotencyKey());

    expect(order.status).toBe('pending');
    expect(order.reference).toMatch(/^KUR-\d{6}$/);
    expect(order.totals.total).toBe('2.386');
    expect(order.transactionHash).toBeNull();

    // A confirmacao vem da simulacao (temporizador + evento), nunca do cliente.
    const confirmed = await vi.waitFor(
      async () => {
        const current = await fetchOrder(order.id);
        expect(current.status).toBe('confirmed');
        return current;
      },
      { timeout: 4_000, interval: 100 },
    );

    expect(confirmed.transactionHash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(confirmed.version).toBeGreaterThan(order.version);

    // Itens comprados saem do carrinho; a edicao perde as unidades vendidas.
    const cart = await fetchCart();
    expect(cart.items).toEqual([]);

    const nft = await fetchNft(NFT_ID);
    expect(nft.edition.available).toBe(10);

    const receipt = await fetchOrderReceipt(order.id);
    expect(receipt.order.totals.total).toBe('2.386');
  });

  it('recupera o mesmo pedido com a mesma chave de idempotencia', async () => {
    const quote = await prepareQuote();
    const body = toOrderRequest(quote);
    const key = createIdempotencyKey();

    const first = await createOrder(body, key);
    const second = await createOrder(body, key);

    expect(second.id).toBe(first.id);
    expect(second.reference).toBe(first.reference);
  });

  it('recusa a mesma chave com corpo diferente', async () => {
    const quote = await prepareQuote();
    const key = createIdempotencyKey();
    await createOrder(toOrderRequest(quote), key);

    await expect(
      createOrder(
        { ...toOrderRequest(quote), collector: { ...COLLECTOR, referralCode: 'KURIO-BIS' } },
        key,
      ),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
      reason: 'IDEMPOTENCY_KEY_REUSED',
      status: 409,
    });
  });

  it('valida os dados do colecionador', async () => {
    const quote = await prepareQuote();

    await expect(
      createOrder(
        {
          ...toOrderRequest(quote),
          collector: { ...COLLECTOR, email: 'invalido', walletAddress: '0x123' },
        },
        createIdempotencyKey(),
      ),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      fieldErrors: { email: expect.any(String), walletAddress: expect.any(String) },
    });
  });
});

describe('pedido sob cenarios de falha', () => {
  it('recusa cotacao desatualizada quando o preco muda durante a compra', async () => {
    await selectScenario('price-changed');
    const quote = await prepareQuote();

    await expect(createOrder(toOrderRequest(quote), createIdempotencyKey())).rejects.toMatchObject({
      code: 'CONFLICT',
      reason: 'PRICE_CHANGED',
      conflicts: [
        expect.objectContaining({
          nftId: 'emerald-ape-042',
          quotedPrice: '1.19',
          currentPrice: '1.33',
        }),
      ],
    });
  });

  it('recusa a compra quando a edicao esgota depois da cotacao', async () => {
    await selectScenario('sold-out');
    const quote = await prepareQuote();

    await expect(createOrder(toOrderRequest(quote), createIdempotencyKey())).rejects.toMatchObject({
      reason: 'EDITION_SOLD_OUT',
    });
  });

  it('recupera o pedido por idempotencia depois de um timeout', async () => {
    await selectScenario('order-timeout');
    const quote = await prepareQuote();
    const body = toOrderRequest(quote);
    const key = createIdempotencyKey();

    // A primeira tentativa estoura o timeout do cliente, mas o pedido ja existe.
    await expect(createOrder(body, key)).rejects.toMatchObject({ code: 'TIMEOUT' });

    const recovered = await createOrder(body, key);
    expect(recovered.reference).toMatch(/^KUR-\d{6}$/);

    // Nenhum pedido duplicado: a tentativa seguinte devolve o mesmo recurso.
    const again = await createOrder(body, key);
    expect(again.id).toBe(recovered.id);
  });

  it('recusa o pagamento no cenario correspondente e devolve as unidades', async () => {
    await selectScenario('payment-declined');
    const quote = await prepareQuote();
    await addCartItem({ nftId: NFT_ID, quantity: QUANTITY });
    const order = await createOrder(toOrderRequest(quote), createIdempotencyKey());

    const declined = await vi.waitFor(
      async () => {
        const current = await fetchOrder(order.id);
        expect(current.status).toBe('declined');
        return current;
      },
      { timeout: 4_000, interval: 100 },
    );

    expect(declined.declineReason).toBe('PAYMENT_DECLINED');

    // Falha preserva o carrinho e devolve a disponibilidade a edicao.
    const cart = await fetchCart();
    expect(cart.items).toHaveLength(1);

    const nft = await fetchNft(NFT_ID);
    expect(nft.edition.available).toBe(12);
  });

  it('recusa o pedido quando a carteira recusou a conexao', async () => {
    await selectScenario('wallet-refused');
    const quote = await prepareQuote();
    await updateWallet(WALLET_ID, { status: 'connected' }).catch(() => null);

    await expect(createOrder(toOrderRequest(quote), createIdempotencyKey())).rejects.toMatchObject({
      code: 'CONFLICT',
      reason: 'WALLET_UNAVAILABLE',
    });
  });

  it('nao devolve recibo de pedido pendente', async () => {
    await selectScenario('payment-manual');
    const quote = await prepareQuote();
    const order = await createOrder(toOrderRequest(quote), createIdempotencyKey());

    await expect(fetchOrderReceipt(order.id)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
