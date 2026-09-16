import { expect, test } from '@playwright/test';

import { signIn, USERS } from './support/auth';
import {
  fillCollectorForm,
  openWalletStep,
  readPlacedOrders,
  submitOrder,
  waitForSummary,
} from './support/checkout';
import {
  emitNftUpdate,
  emitOrderUpdate,
  seedCart,
  startApp,
  switchScenario,
} from './support/mocks';

/**
 * Tempo real no checkout — cenarios 9 e 10 do enunciado §9.
 *
 * Os eventos saem do SERVIDOR simulado pelos endpoints de controle e chegam a
 * interface pelo `socket.io-client`: nenhum teste escreve no cache nem chama
 * setter da tela. E o caminho de producao, exercitado.
 */

/** Item comprado nos testes; 12 unidades disponiveis e limite de 3 por pedido. */
const NFT_ID = 'emerald-ape-042';

/** Carrinho das compras. */
const CART = [{ nftId: NFT_ID, quantity: 2 }] as const;

test.describe('cenario 9 — mudanca de preco durante o checkout', () => {
  test('bloqueia a confirmacao e exige nova confirmacao explicita', async ({ page }) => {
    await startApp(page, 'default');
    await seedCart(page, CART);
    await signIn(page, USERS.ana);

    await switchScenario(page, 'payment-manual');
    await page.goto('/pagamento');
    await waitForSummary(page);
    await fillCollectorForm(page);
    await openWalletStep(page);
    await expect(page.getByTestId('checkout-submit')).toBeEnabled();

    // O preco muda no servidor e o evento chega pelo socket.
    await emitNftUpdate(page, { nftId: NFT_ID, price: '1.59' });

    const notice = page.getByTestId('stale-quote-notice');
    await expect(notice).toBeVisible();
    // A interface diz O QUE mudou, e nao apenas "algo mudou".
    await expect(page.getByTestId('stale-quote-conflicts')).toContainText('Emerald Ape #042');
    await expect(page.getByTestId('checkout-live-region')).toContainText('valores da compra mudaram');

    // Cotacao desatualizada nunca finaliza.
    await expect(page.getByTestId('checkout-submit')).toBeDisabled();
    expect(await readPlacedOrders(page)).toHaveLength(0);

    // O resumo ja mostra o valor novo antes de a compra ser liberada. O
    // seletor vale nos dois frames: 1440 mostra o subtotal, 414 mostra o total.
    await expect(page.locator('body')).toContainText('3.18');

    const acknowledge = page.getByTestId('stale-quote-acknowledge');
    await expect(acknowledge).toBeEnabled();
    await acknowledge.click();

    await expect(notice).toHaveCount(0);
    await submitOrder(page);
    await expect(page.getByTestId('order-pending')).toBeVisible();

    const orders = await readPlacedOrders(page);
    expect(orders).toHaveLength(1);
  });

  test('o cenario de preco alterado bloqueia antes mesmo do envio', async ({ page }) => {
    await startApp(page, 'default');
    await seedCart(page, CART);
    await signIn(page, USERS.ana);

    // O cenario muda o preco do primeiro item logo DEPOIS da cotacao. Como a
    // mudanca e real no servidor, ela sai como `nft.updated` — e o portao a
    // pega antes de o usuario chegar a clicar. O `409` da revalidacao do
    // servidor continua sendo a rede de seguranca por tras disso, e esta
    // coberto na suite de rede (`src/test/checkout.test.ts`).
    await switchScenario(page, 'price-changed');
    await page.goto('/pagamento');
    await waitForSummary(page);
    await fillCollectorForm(page);

    await expect(page.getByTestId('stale-quote-notice')).toBeVisible();

    // O bloqueio acompanha o usuario ate o CTA, em qualquer composicao.
    await openWalletStep(page);
    await expect(page.getByTestId('checkout-submit')).toBeDisabled();
    expect(await readPlacedOrders(page)).toHaveLength(0);

    // Depois da nova confirmacao a compra segue, com os valores atualizados.
    await page.getByTestId('stale-quote-acknowledge').click();
    await submitOrder(page);
    await expect(page.getByTestId('receipt-dialog')).toBeVisible({ timeout: 15_000 });
    expect(await readPlacedOrders(page)).toHaveLength(1);
  });

  test('evento antigo nao regride o estado nem reaplica o bloqueio', async ({ page }) => {
    await startApp(page, 'default');
    await seedCart(page, CART);
    await signIn(page, USERS.ana);

    await switchScenario(page, 'payment-manual');
    await page.goto('/pagamento');
    await waitForSummary(page);

    await emitNftUpdate(page, { nftId: NFT_ID, price: '1.59' });
    await expect(page.getByTestId('stale-quote-notice')).toBeVisible();

    await page.getByTestId('stale-quote-acknowledge').click();
    await expect(page.getByTestId('stale-quote-notice')).toHaveCount(0);

    // Envelope com versao antiga e preco anterior: tem que ser descartado — o
    // bloqueio nao volta e o resumo nao regride para 2.38.
    await emitNftUpdate(page, { nftId: NFT_ID, price: '1.19', version: 1 });
    await expect(page.getByTestId('stale-quote-notice')).toHaveCount(0);
    await expect(page.getByTestId('checkout-summary-values')).toContainText('3.18');
  });
});

test.describe('cenario 10 — eventos de pedido e retomada', () => {
  test('order.updated duplicado nao reaplica efeito e o estado e terminal', async ({ page }) => {
    await startApp(page, 'default');
    await seedCart(page, CART);
    await signIn(page, USERS.ana);

    await switchScenario(page, 'payment-manual');
    await page.goto('/pagamento');
    await waitForSummary(page);
    await fillCollectorForm(page);
    await submitOrder(page);
    await expect(page.getByTestId('order-pending')).toBeVisible();

    const [order] = await readPlacedOrders(page);
    expect(await emitOrderUpdate(page, { orderId: order.id, status: 'confirmed' })).toBe(200);
    await expect(page.getByTestId('receipt-dialog')).toBeVisible();

    // Reentrega do mesmo estado: o servidor recusa (ja e terminal) e a tela
    // continua com um recibo so.
    expect(await emitOrderUpdate(page, { orderId: order.id, status: 'confirmed' })).toBe(409);

    // Nem uma recusa posterior reabre um pedido confirmado.
    expect(await emitOrderUpdate(page, { orderId: order.id, status: 'declined' })).toBe(409);

    await expect(page.getByTestId('receipt-dialog')).toHaveCount(1);
    await expect(page.getByTestId('order-declined')).toHaveCount(0);

    const after = await readPlacedOrders(page);
    expect(after).toHaveLength(1);
    expect(after[0].status).toBe('confirmed');
  });

  test('recarregar com pedido pendente retoma o MESMO pedido', async ({ page }) => {
    await startApp(page, 'default');
    await seedCart(page, CART);
    await signIn(page, USERS.ana);

    await switchScenario(page, 'payment-manual');
    await page.goto('/pagamento');
    await waitForSummary(page);
    await fillCollectorForm(page);
    await submitOrder(page);
    await expect(page.getByTestId('order-pending')).toBeVisible();

    const created = await readPlacedOrders(page);
    expect(created).toHaveLength(1);

    // Interrupcao: a pagina recarrega com o pedido ainda pendente.
    await page.reload();
    await expect(page.getByTestId('order-pending')).toBeVisible();

    // Nenhuma segunda compra nasceu da retomada.
    const resumed = await readPlacedOrders(page);
    expect(resumed).toHaveLength(1);
    expect(resumed[0].id).toBe(created[0].id);

    // E o pedido retomado ainda responde ao evento da simulacao.
    await emitOrderUpdate(page, { orderId: created[0].id, status: 'confirmed' });
    await expect(page.getByTestId('receipt-dialog')).toBeVisible();
    expect(await readPlacedOrders(page)).toHaveLength(1);
  });

  test('reconexao reconcilia o pedido pelo REST', async ({ page, context }) => {
    await startApp(page, 'default');
    await seedCart(page, CART);
    await signIn(page, USERS.ana);

    await switchScenario(page, 'payment-manual');
    await page.goto('/pagamento');
    await waitForSummary(page);
    await fillCollectorForm(page);
    await submitOrder(page);
    await expect(page.getByTestId('order-pending')).toBeVisible();

    const [order] = await readPlacedOrders(page);

    // Conexao cai; o evento de confirmacao acontece com a tela desligada.
    await context.setOffline(true);
    await context.setOffline(false);

    // Ao voltar, o REST tem a palavra final: o estado e reconciliado sem que
    // uma segunda compra seja criada.
    await emitOrderUpdate(page, { orderId: order.id, status: 'confirmed' });
    await expect(page.getByTestId('receipt-dialog')).toBeVisible({ timeout: 15_000 });
    expect(await readPlacedOrders(page)).toHaveLength(1);
  });
});
