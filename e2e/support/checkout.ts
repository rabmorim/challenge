import { expect, type Page } from '@playwright/test';

import { readOrders } from './mocks';

/**
 * Atalhos do fluxo de pagamento usados pelos testes.
 *
 * Tudo aqui opera pela interface, como o usuario faria — preencher campos,
 * escolher carteira, clicar em "Confirmar compra". A preparacao de cenario
 * (carrinho semeado, troca de cenario, disparo de evento) fica em
 * `support/mocks.ts` e passa pela API, nao pelo cache.
 */

/** Largura (px) a partir da qual o card do catalogo mostra a faixa de acoes (`lg`). */
const CARD_ACTIONS_BREAKPOINT = 1024;

/** Valores validos do formulario do colecionador, nos campos do frame. */
export const COLLECTOR_INPUT = {
  displayName: 'Ana Ribeiro',
  profileName: 'Acervo Ribeiro',
  referralCode: 'KURIO-ANA',
} as const;

/**
 * Preenche os campos obrigatorios que o prefill nao cobre.
 *
 * Nome de usuario e e-mail vem da conta; endereco, rede e tipo de carteira vem
 * da carteira selecionada. Sobram tres campos, e sao esses que o teste digita.
 *
 * @param page - Pagina do teste, na tela de pagamento.
 */
export async function fillCollectorForm(page: Page): Promise<void> {
  await openCollectorForm(page);

  await page.getByLabel('Nome de exibição').fill(COLLECTOR_INPUT.displayName);
  await page.getByLabel('Nome do perfil').fill(COLLECTOR_INPUT.profileName);
  await page.getByLabel('Código de indicação').fill(COLLECTOR_INPUT.referralCode);
}

/**
 * Espera o resumo da compra estar carregado (sem esqueleto).
 *
 * @param page - Pagina do teste.
 */
export async function waitForSummary(page: Page): Promise<void> {
  await openOrderSummary(page);

  await expect(page.getByTestId('checkout-summary-skeleton')).toHaveCount(0);
  await expect(page.getByTestId('checkout-summary-values')).toBeVisible();
}

/**
 * Coloca o primeiro NFT do catalogo no carrinho, pela interface.
 *
 * A faixa de acoes sobre a arte so existe a partir de `lg` — no toque nao ha
 * ponteiro, e o frame de 414 deixa so o coracao no card. Entao o caminho do
 * celular e o mesmo do usuario: abrir o detalhe e usar a barra de compra. O
 * teste continua descrevendo "adicionei o primeiro item do catalogo".
 *
 * @param page - Pagina do teste, no Mercado.
 */
export async function addFirstNftToCart(page: Page): Promise<void> {
  await expect(page.getByTestId('nft-card').first()).toBeVisible();

  // A decisao sai da LARGURA, e nao de `isVisible()`: a faixa de acoes nasce
  // com opacidade zero ate o ponteiro chegar, e "visivel" para o Playwright
  // inclui elementos transparentes — a escolha ficaria a merce do instante em
  // que a grade terminou de montar.
  const width = page.viewportSize()?.width ?? 0;

  if (width >= CARD_ACTIONS_BREAKPOINT) {
    await page.locator('[data-testid="card-add-to-cart"]').first().click();
    return;
  }

  await page.getByTestId('nft-card').first().getByRole('link').first().click();
  await page.getByTestId('add-to-cart-button').click();
}

/**
 * Abre uma secao recolhivel do pagamento, quando ela existe.
 *
 * O frame de 1440 mostra formulario e resumo de uma vez; o de 414 desenha so a
 * carteira e guarda os dois atras de um `details`. Os testes descrevem o FLUXO,
 * nao a composicao, entao o passo extra do celular fica aqui — e cada teste
 * vale nos dois viewports sem um `if` de largura espalhado pelos arquivos.
 *
 * @param page - Pagina do teste, na tela de pagamento.
 * @param testId - Secao a revelar.
 */
async function openSection(page: Page, testId: string): Promise<void> {
  // O formulario existe nas duas composicoes: esperar por ele evita decidir se
  // a secao existe ANTES de a tela montar — num carregamento lento, a resposta
  // seria sempre "nao existe", e o conteudo ficaria recolhido.
  await expect(page.getByTestId('collector-form')).toBeAttached();

  const section = page.getByTestId(testId);
  if ((await section.count()) === 0) return;
  if ((await section.getAttribute('open')) !== null) return;

  await section.locator('summary').click();
  await expect(section).toHaveAttribute('open', '');
}

/**
 * Revela o formulario do colecionador.
 *
 * @param page - Pagina do teste, na tela de pagamento.
 */
export async function openCollectorForm(page: Page): Promise<void> {
  await openSection(page, 'checkout-collector-section');
}

/**
 * Revela o resumo do pedido (itens, cupom e valores).
 *
 * @param page - Pagina do teste, na tela de pagamento.
 */
export async function openOrderSummary(page: Page): Promise<void> {
  await openSection(page, 'checkout-summary-section');
}

/**
 * Aciona a conexao simulada da carteira selecionada.
 *
 * O frame de 1440 traz a acao em linha, abaixo do bloco "Carteira e rede"; o de
 * 414 a guarda no menu de tres pontos do cartao. O teste descreve "conectei a
 * carteira", e o caminho de cada composicao fica aqui.
 *
 * @param page - Pagina do teste, na etapa da carteira.
 * @param walletId - Carteira a conectar (id da fixture).
 */
export async function connectWallet(page: Page, walletId: string): Promise<void> {
  const inline = page.getByTestId('wallet-connect');

  if ((await inline.count()) > 0) {
    await inline.click();
    return;
  }

  await page.getByTestId(`wallet-card-${walletId}`).getByRole('button').click();
  await page.getByTestId(`wallet-connect-${walletId}`).click();
}

/**
 * Aciona o envio sem garantir que ele vai passar.
 *
 * E o mesmo "Confirmar compra" nas duas composicoes: formulario invalido para
 * no lugar e mostra os erros nos campos — no frame de 414, revelando a secao
 * que os guarda.
 *
 * @param page - Pagina do teste, na tela de pagamento.
 */
export async function attemptSubmit(page: Page): Promise<void> {
  await page.getByTestId('checkout-submit').click();
}

/**
 * Envia o pedido pelo CTA do frame.
 *
 * @param page - Pagina do teste, com o formulario preenchido.
 */
export async function submitOrder(page: Page): Promise<void> {
  const submit = page.getByTestId('checkout-submit');
  await expect(submit).toBeEnabled();
  await submit.click();
}

/**
 * Pedido ja semeado na conta da Ana (fixture), que nao pertence a nenhum teste.
 * Existe para a tela de perfil ter historico desde o primeiro acesso.
 */
export const SEEDED_ORDER_ID = 'order-seed-ana';

/**
 * Pedidos criados PELO TESTE, sem o que ja vinha semeado.
 *
 * E sobre estes que valem as afirmacoes de duplicidade: "criou um pedido" e
 * "criou dois" sao fatos do servidor, e contar o historico da fixture junto
 * esconderia exatamente o que se quer medir.
 *
 * @param page - Pagina do teste, ja autenticada.
 * @returns Pedidos do teste, do mais recente para o mais antigo.
 */
export async function readPlacedOrders(
  page: Page,
): Promise<{ id: string; status: string; reference: string }[]> {
  const orders = await readOrders(page);
  return orders.filter((order) => order.id !== SEEDED_ORDER_ID);
}
