import { expect, test, type Page } from '@playwright/test';

import { expectAuthPanelOpen, signIn, submitLogin, USERS } from './support/auth';
import { emitNftUpdate, seedCart, startApp } from './support/mocks';

/**
 * Cenario 5 do enunciado: carrinho, quantidades, remocao, cupom e persistencia
 * apos refresh/login — mais a parte do §7 que cabe nesta fase (preco e
 * disponibilidade mudando com o carrinho aberto).
 *
 * Cada teste parte de estado isolado: contexto de navegador novo (storage
 * vazio) + reset da simulacao antes da primeira interacao.
 */

/** Linha do carrinho de um NFT, valendo para a tabela de 1440 e o card de 414. */
function cartRow(page: Page, nftId: string) {
  return page.locator(`[data-testid="cart-row"][data-nft="${nftId}"]`);
}

/**
 * Le os valores do resumo como a tela os exibe.
 *
 * @param page - Pagina do teste.
 * @returns Subtotal, desconto, taxa e total em texto.
 */
async function readSummary(page: Page): Promise<string[]> {
  return page.locator('[data-testid="summary-values"] dd').allInnerTexts();
}

/** Corpo da cotacao, no recorte que os testes conferem. */
interface QuoteBody {
  subtotal: string;
  discount: string;
  networkFee: string;
  total: string;
  coupon: { code: string } | null;
  lines: { nftId: string; unitPrice: string }[];
}

/**
 * Espera a cotacao que corresponde ao estado sob teste.
 *
 * O resumo e autoritativo do servidor, e mais de uma cotacao pode estar em voo
 * (a do carregamento e a que a interacao provocou). Sem o `match`, o teste
 * poderia prender a primeira que passasse e comparar a tela com valores que ela
 * ja substituiu.
 *
 * @param page - Pagina do teste.
 * @param match - Reconhece a cotacao esperada; por padrao, a primeira que vier.
 * @returns Corpo da cotacao.
 */
async function waitForQuote(
  page: Page,
  match: (quote: QuoteBody) => boolean = () => true,
): Promise<QuoteBody> {
  let matched: QuoteBody | null = null;

  await page.waitForResponse(async (candidate) => {
    if (!candidate.url().includes('/api/quotes') || candidate.request().method() !== 'POST') {
      return false;
    }
    if (!candidate.ok()) return false;

    const body = (await candidate.json()) as QuoteBody;
    if (!match(body)) return false;

    matched = body;
    return true;
  });

  // O `waitForResponse` so resolve depois de `match` devolver `true`.
  return matched as unknown as QuoteBody;
}

test.describe('carrinho', () => {
  test('adiciona do catalogo, reflete no selo do header e aparece no carrinho', async ({
    page,
    isMobile,
  }) => {
    // O icone de carrinho sobre a arte so existe a partir de `lg` — no frame de
    // 414 a faixa de acoes guarda apenas o coracao, e o caminho do celular e o
    // detalhe (testado logo abaixo).
    test.skip(Boolean(isMobile), 'A faixa de acoes do card so existe no frame de 1440.');

    await startApp(page, 'default', '/mercado');

    const card = page.locator('[data-testid="card-add-to-cart"]').first();
    await card.scrollIntoViewIfNeeded();
    await card.click();

    await expect(page.getByTestId('cart-count')).toHaveText('1');

    await page.goto('/carrinho');
    await expect(page.getByTestId('cart-row')).toHaveCount(1);
  });

  test('comprar no detalhe sem sessao abre o painel e nao adiciona nada', async ({ page }) => {
    await startApp(page, 'default', '/nft/emerald-ape-042');

    await page.getByTestId('buy-button').click();

    await expectAuthPanelOpen(page);
    // Nada foi adicionado: o selo do header continua sem contagem.
    await expect(page.getByTestId('cart-count')).toHaveCount(0);
  });

  test('comprar no detalhe com sessao adiciona a quantidade escolhida', async ({ page }) => {
    await startApp(page, 'default');
    await signIn(page, USERS.ana);

    await page.goto('/nft/emerald-ape-042');
    await page.getByRole('button', { name: 'Aumentar quantidade' }).click();
    await expect(page.getByTestId('quantity-value')).toHaveValue('2');

    await page.getByTestId('buy-button').click();

    await expect(page.getByTestId('cart-count')).toHaveText('2');
  });

  test('altera a quantidade e nao deixa passar da disponibilidade', async ({ page }) => {
    await startApp(page, 'default');
    // `emerald-ape-042`: 12 unidades disponiveis, limite de 3 por pedido.
    await seedCart(page, [{ nftId: 'emerald-ape-042', quantity: 1 }]);
    await page.goto('/carrinho');

    const row = cartRow(page, 'emerald-ape-042');
    await expect(row).toBeVisible();

    const increase = row.getByRole('button', { name: /^Aumentar a quantidade/ });
    await increase.click();
    await expect(row.getByTestId('cart-quantity')).toHaveValue('2');
    await expect(row.getByTestId('cart-line-total')).toHaveText('2.38 ETH');

    await increase.click();
    await expect(row.getByTestId('cart-quantity')).toHaveValue('3');

    // No teto: o "+" para de responder e a regiao viva explica o motivo.
    await expect(increase).toBeDisabled();
    await expect(page.getByTestId('cart-live-region')).toContainText('quantidade alterada para 3');

    // Digitar acima do teto tambem e aparado, sem virar erro do servidor.
    await row.getByTestId('cart-quantity').fill('9');
    await expect(row.getByTestId('cart-quantity')).toHaveValue('3');
    await expect(page.getByTestId('cart-live-region')).toContainText('A quantidade foi ajustada');
  });

  test('o resumo reproduz exatamente a cotacao da API', async ({ page }) => {
    await startApp(page, 'default');
    await seedCart(page, [
      { nftId: 'emerald-ape-042', quantity: 2 },
      { nftId: 'golden-beat-207', quantity: 1 },
    ]);

    const quoted = waitForQuote(page);
    await page.goto('/carrinho');
    const quote = await quoted;

    await expect(page.getByTestId('summary-values')).toBeVisible();
    const [subtotal, discount, networkFee, total] = await readSummary(page);

    expect(subtotal).toContain(quote.subtotal);
    expect(discount).toContain('(-)');
    expect(networkFee).toContain(quote.networkFee);
    expect(total).toContain(quote.total);
  });

  test('remove um item depois de confirmar', async ({ page }) => {
    await startApp(page, 'default');
    await seedCart(page, [
      { nftId: 'emerald-ape-042', quantity: 1 },
      { nftId: 'golden-beat-207', quantity: 1 },
    ]);
    await page.goto('/carrinho');

    await expect(page.getByTestId('cart-row')).toHaveCount(2);

    await cartRow(page, 'golden-beat-207').getByTestId('cart-remove').click();
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await page.getByTestId('cart-remove-confirm').click();

    await expect(page.getByTestId('cart-row')).toHaveCount(1);
    await expect(page.getByTestId('cart-live-region')).toContainText('removido do carrinho');
  });

  test('cupom valido desconta e cupom invalido nao derruba o resumo', async ({ page }) => {
    await startApp(page, 'default');
    // Subtotal alto o bastante para o cupom valer sem cair em subtotal minimo.
    await seedCart(page, [{ nftId: 'emerald-ape-042', quantity: 3 }]);
    await page.goto('/carrinho');
    await expect(page.getByTestId('summary-values')).toBeVisible();

    // Codigo inexistente: erro no campo, resumo intacto.
    await page.getByTestId('coupon-input').fill('NAO-EXISTE');
    await page.getByTestId('coupon-apply').click();
    await expect(page.getByTestId('coupon-error')).toBeVisible();
    await expect(page.getByTestId('coupon-input')).toHaveAttribute('aria-invalid', 'true');
    const [, semDesconto] = await readSummary(page);
    expect(semDesconto).toContain('(-) 00.00');

    // Cupom expirado: mesma resposta da interface, motivo diferente.
    await page.getByTestId('coupon-input').fill('GENESIS20');
    await page.getByTestId('coupon-apply').click();
    await expect(page.getByTestId('coupon-error')).toContainText(/expirou/i);

    // Cupom valido: o desconto vem da cotacao, nao de uma conta local.
    const quoted = waitForQuote(page, (body) => body.coupon?.code === 'KURIO10');
    await page.getByTestId('coupon-input').fill('KURIO10');
    await page.getByTestId('coupon-apply').click();
    const quote = await quoted;

    await expect(page.getByTestId('coupon-error')).toHaveCount(0);
    await expect
      .poll(async () => (await readSummary(page))[1])
      .toContain(quote.discount);
    await expect(page.getByTestId('summary-total')).toContainText(quote.total);

    // Remover o cupom recalcula e o desconto volta ao traco do frame.
    await page.getByTestId('coupon-remove').click();
    await expect.poll(async () => (await readSummary(page))[1]).toContain('(-) 00.00');
  });

  test('os itens sobrevivem ao refresh', async ({ page }) => {
    await startApp(page, 'default');
    await seedCart(page, [{ nftId: 'violet-nomad-314', quantity: 2 }]);
    await page.goto('/carrinho');

    await expect(cartRow(page, 'violet-nomad-314')).toBeVisible();

    await page.reload();

    await expect(cartRow(page, 'violet-nomad-314')).toBeVisible();
    await expect(cartRow(page, 'violet-nomad-314').getByTestId('cart-quantity')).toHaveValue('2');
  });

  test('o carrinho do visitante e preservado ao entrar na conta', async ({ page }) => {
    await startApp(page, 'default');
    // Visitante: o carrinho existe antes de qualquer sessao.
    await seedCart(page, [
      { nftId: 'cosmic-bloom-118', quantity: 2 },
      { nftId: 'golden-beat-207', quantity: 1 },
    ]);
    await page.goto('/carrinho');
    await expect(page.getByTestId('cart-row')).toHaveCount(2);

    // O caminho desenhado: o frame de 414 nao traz header nem barra de atalhos
    // no carrinho, entao a sessao do visitante comeca pelo proprio "Conectar e
    // finalizar", que cai no guard do pagamento e volta ao destino depois.
    await page.getByTestId('cart-checkout').click();
    await submitLogin(page, USERS.ana);
    await expect(page).toHaveURL(/\/pagamento/);

    await page.goto('/carrinho');

    // Os itens continuam la, com as quantidades, agora na conta da Ana.
    await expect(page.getByTestId('cart-row')).toHaveCount(2);
    await expect(cartRow(page, 'cosmic-bloom-118').getByTestId('cart-quantity')).toHaveValue('2');
    await expect(cartRow(page, 'golden-beat-207').getByTestId('cart-quantity')).toHaveValue('1');

    // E sobrevivem ao refresh porque agora pertencem a sessao, nao ao visitante.
    await page.reload();
    await expect(page.getByTestId('cart-row')).toHaveCount(2);
  });

  test('nft.updated muda a linha e o resumo, e evento antigo nao regride nada', async ({
    page,
  }) => {
    await startApp(page, 'default');
    await seedCart(page, [{ nftId: 'emerald-ape-042', quantity: 2 }]);
    await page.goto('/carrinho');

    const row = cartRow(page, 'emerald-ape-042');
    await expect(row.getByTestId('cart-line-total')).toHaveText('2.38 ETH');

    // Preco muda com o carrinho aberto: linha, resumo e aviso. A cotacao
    // esperada e a que ja traz o preco novo — a do carregamento nao serve.
    const quoted = waitForQuote(page, (body) => body.lines[0]?.unitPrice === '1.50');
    await emitNftUpdate(page, { nftId: 'emerald-ape-042', price: '1.50' });
    const quote = await quoted;

    await expect(row.getByTestId('cart-line-total')).toHaveText('3.00 ETH');
    await expect(page.getByTestId('summary-total')).toContainText(quote.total);
    await expect(page.getByTestId('cart-live-region')).toContainText('mudou de preço');

    // Evento reentregue (mesma versao): nenhum efeito novo.
    await emitNftUpdate(page, { nftId: 'emerald-ape-042' });
    await expect(row.getByTestId('cart-line-total')).toHaveText('3.00 ETH');

    // Evento antigo, com preco menor: descartado sem regredir o estado novo.
    await emitNftUpdate(page, { nftId: 'emerald-ape-042', price: '0.10', version: 1 });
    await page.waitForTimeout(500);
    await expect(row.getByTestId('cart-line-total')).toHaveText('3.00 ETH');
    await expect(page.getByTestId('summary-total')).toContainText(quote.total);
  });

  test('disponibilidade abaixo da quantidade apara a linha e avisa', async ({ page }) => {
    await startApp(page, 'default');
    await seedCart(page, [{ nftId: 'emerald-ape-042', quantity: 3 }]);
    await page.goto('/carrinho');

    const row = cartRow(page, 'emerald-ape-042');
    await expect(row.getByTestId('cart-quantity')).toHaveValue('3');

    await emitNftUpdate(page, { nftId: 'emerald-ape-042', available: 1 });

    await expect(row.getByTestId('cart-quantity')).toHaveValue('1');
    await expect(page.getByTestId('cart-live-region')).toContainText(
      'restam 1 unidade nesta edição. A quantidade foi ajustada',
    );
  });

  test('carrinho vazio oferece a saida para o mercado', async ({ page }) => {
    await startApp(page, 'default', '/carrinho');

    await expect(page.getByTestId('cart-empty')).toBeVisible();
    await page.getByRole('link', { name: 'Continuar explorando' }).click();

    await expect(page).toHaveURL(/\/mercado/);
  });

  test('conectar e finalizar leva o visitante ao login e depois ao pagamento', async ({ page }) => {
    await startApp(page, 'default');
    await seedCart(page, [{ nftId: 'emerald-ape-042', quantity: 1 }]);
    await page.goto('/carrinho');

    await page.getByTestId('cart-checkout').click();

    // O gate e o guard da rota privada: painel aberto, destino guardado.
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page).toHaveURL(/redirect=%2Fpagamento|redirect=\/pagamento/);

    await page.getByRole('dialog').getByLabel('E-mail').fill(USERS.ana.email);
    await page.getByRole('dialog').getByLabel('Senha', { exact: true }).fill(USERS.ana.password);
    await page.getByRole('dialog').getByRole('button', { name: 'Entrar', exact: true }).click();

    await expect(page).toHaveURL(/\/pagamento/);
    // A tela de pagamento em si, e nao um marcador: o formulario do colecionador
    // so existe atras do guard. `toBeAttached` porque no frame de 414 ele nasce
    // dentro da secao recolhida.
    await expect(page.getByTestId('collector-form')).toBeAttached();
  });
});
