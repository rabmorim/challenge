import { expect, test } from './support/test';

import { signIn, USERS } from './support/auth';
import {
  addFirstNftToCart,
  attemptSubmit,
  connectWallet,
  fillCollectorForm,
  readPlacedOrders,
  submitOrder,
  waitForSummary,
} from './support/checkout';
import {
  emitOrderUpdate,
  seedCart,
  startApp,
  switchScenario,
} from './support/mocks';

/**
 * Pagamento e confirmacao — cenarios 6 e 7 do enunciado §9.
 *
 * Todos partem de estado isolado (reset da simulacao + contexto de navegador
 * novo) e observam a INTERFACE e o resultado no servidor: as afirmacoes sobre
 * "quantos pedidos existem" leem `GET /orders`, porque duplicidade e um fato do
 * servidor, nao do que a tela mostra.
 */

/** Carrinho usado nas compras, dentro do limite por pedido de cada edicao. */
const CART = [
  { nftId: 'emerald-ape-042', quantity: 2 },
  { nftId: 'violet-nomad-314', quantity: 1 },
] as const;

test.describe('cenario 6 — compra completa', () => {
  test('vai do catalogo ao recibo confirmado pela simulacao', async ({ page }) => {
    await startApp(page, 'default');
    await signIn(page, USERS.ana);

    // Do catalogo: o item entra pela interface, como o usuario faria.
    await page.goto('/mercado');
    await addFirstNftToCart(page);
    await expect(page.getByTestId('cart-count')).toHaveText('1');

    await page.goto('/carrinho');
    await page.getByTestId('cart-checkout').click();
    await expect(page).toHaveURL(/\/pagamento/);

    await waitForSummary(page);
    await fillCollectorForm(page);

    // Antes do envio nao existe pedido nenhum; a confirmacao nao pode ser
    // otimista, entao o recibo nao pode estar na tela.
    await expect(page.getByTestId('receipt-dialog')).toHaveCount(0);

    await submitOrder(page);

    // O pedido nasce pendente e so a simulacao o confirma (`order.updated`).
    await expect(page.getByTestId('order-pending')).toBeVisible();

    const dialog = page.getByTestId('receipt-dialog');
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await expect(dialog.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible();
    await expect(page.getByTestId('receipt-line')).toHaveCount(1);

    // O anuncio acessivel acompanha a mudanca de estado.
    await expect(page.getByTestId('checkout-live-region')).toContainText('confirmado');

    const orders = await readPlacedOrders(page);
    expect(orders).toHaveLength(1);
    expect(orders[0].status).toBe('confirmed');
  });

  test('remove do carrinho apenas os itens comprados', async ({ page }) => {
    await startApp(page, 'default');
    await seedCart(page, CART);
    await signIn(page, USERS.ana);

    // Pagamento pendente ate o teste mandar: da tempo de mexer no carrinho
    // entre a criacao do pedido e a confirmacao.
    await switchScenario(page, 'payment-manual');
    await page.goto('/pagamento');
    await waitForSummary(page);
    await fillCollectorForm(page);
    await submitOrder(page);
    await expect(page.getByTestId('order-pending')).toBeVisible();

    // Item que NAO entrou no pedido: precisa sobreviver a confirmacao.
    await seedCart(page, [{ nftId: 'golden-beat-207', quantity: 1 }]);

    const [order] = await readPlacedOrders(page);
    await emitOrderUpdate(page, { orderId: order.id, status: 'confirmed' });
    await expect(page.getByTestId('receipt-dialog')).toBeVisible();

    await page.goto('/carrinho');
    await expect(page.getByTestId('cart-row')).toHaveCount(1);
    await expect(page.getByTestId('cart-row')).toContainText('Golden Beat #207');
  });
});

test.describe('cenario 7 — falhas de pagamento', () => {
  test('pagamento recusado preserva os itens e nao emite recibo', async ({ page }) => {
    await startApp(page, 'default');
    await seedCart(page, CART);
    await signIn(page, USERS.ana);

    await switchScenario(page, 'payment-declined');
    await page.goto('/pagamento');
    await waitForSummary(page);
    await fillCollectorForm(page);
    await submitOrder(page);

    await expect(page.getByTestId('order-declined')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('receipt-dialog')).toHaveCount(0);
    await expect(page.getByTestId('checkout-live-region')).toContainText('recusado');

    // Falha preserva a compra: os itens continuam no carrinho.
    await page.goto('/carrinho');
    await expect(page.getByTestId('cart-row')).toHaveCount(CART.length);
  });

  test('clique repetido cria um unico pedido', async ({ page }) => {
    await startApp(page, 'default');
    await seedCart(page, CART);
    await signIn(page, USERS.ana);

    await switchScenario(page, 'payment-manual');
    await page.goto('/pagamento');
    await waitForSummary(page);
    await fillCollectorForm(page);


    // Dois cliques no MESMO quadro, antes de o React desabilitar o botao: e o
    // caso que o botao desabilitado sozinho nao cobre.
    await page.getByTestId('checkout-submit').evaluate((element) => {
      const button = element as unknown as { click: () => void };
      button.click();
      button.click();
    });

    await expect(page.getByTestId('order-pending')).toBeVisible();

    const orders = await readPlacedOrders(page);
    expect(orders).toHaveLength(1);
  });

  test('timeout apos criar o pedido recupera o mesmo pedido', async ({ page }) => {
    // O cliente espera o timeout inteiro (15s) antes de desistir.
    test.setTimeout(90_000);

    await startApp(page, 'default');
    await seedCart(page, CART);
    await signIn(page, USERS.ana);

    await switchScenario(page, 'order-timeout');
    await page.goto('/pagamento');
    await waitForSummary(page);
    await fillCollectorForm(page);
    await submitOrder(page);

    // A resposta nao chega: a interface admite a incerteza em vez de inventar
    // um desfecho.
    await expect(page.getByTestId('order-unknown')).toBeVisible({ timeout: 30_000 });

    // O pedido existe do outro lado, criado pela tentativa que estourou — e a
    // simulacao ja o resolveu enquanto o cliente esperava.
    const created = await readPlacedOrders(page);
    expect(created).toHaveLength(1);

    // O reenvio usa a MESMA chave de idempotencia: recupera, nao cria. E o
    // pedido recuperado traz o desfecho que a simulacao ja tinha decidido.
    await page.getByTestId('order-retry').click();
    await expect(page.getByTestId('receipt-dialog')).toBeVisible({ timeout: 30_000 });

    const after = await readPlacedOrders(page);
    expect(after).toHaveLength(1);
    expect(after[0].id).toBe(created[0].id);
  });
});

test.describe('validacao e acessibilidade do formulario', () => {
  test('aponta os campos obrigatorios e nao envia nada', async ({ page }) => {
    await startApp(page, 'default');
    await seedCart(page, CART);
    await signIn(page, USERS.ana);

    await page.goto('/pagamento');
    await waitForSummary(page);

    // Sem preencher: o envio para na validacao, associada aos campos.
    await attemptSubmit(page);

    const displayName = page.getByLabel('Nome de exibição');
    await expect(displayName).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#collector-display-name-error')).toBeVisible();
    await expect(displayName).toHaveAttribute('aria-describedby', 'collector-display-name-error');

    expect(await readPlacedOrders(page)).toHaveLength(0);

    // O erro sai da tela no momento em que deixa de ser verdade.
    await displayName.fill('Ana Ribeiro');
    await expect(page.locator('#collector-display-name-error')).toHaveCount(0);
  });

  test('o recibo prende o foco e o devolve ao fechar', async ({ page }) => {
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
    await emitOrderUpdate(page, { orderId: order.id, status: 'confirmed' });

    const dialog = page.getByTestId('receipt-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('role', 'dialog');

    // O foco esta preso no dialogo: tabular nao alcanca a pagina atras dele.
    await page.keyboard.press('Tab');
    await expect(dialog.locator(':focus')).toHaveCount(1);

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });
});

test.describe('conexao simulada da carteira', () => {
  test('conexao recusada nao deixa confirmar e aparece na tela', async ({ page }) => {
    await startApp(page, 'default');
    await seedCart(page, CART);
    await signIn(page, USERS.ana);

    // O cenario nega a conexao, como o usuario negando o pedido na extensao.
    await switchScenario(page, 'wallet-refused');
    await page.goto('/pagamento');
    await waitForSummary(page);
    await fillCollectorForm(page);

    // A carteira WalletConnect da Ana nasce desconectada: e a que pede conexao.
    await page.getByTestId('wallet-provider-walletconnect').click();

    await connectWallet(page, 'wallet-ana-secondary');

    // Sem sucesso falso: a recusa e mostrada e a compra continua travada.
    await expect(page.getByTestId('wallet-connection-error').first()).toBeVisible();
    await expect(page.getByTestId('checkout-submit')).toBeDisabled();
    expect(await readPlacedOrders(page)).toHaveLength(0);
  });
});
