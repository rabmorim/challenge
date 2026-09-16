import { expect, test, type Page } from '@playwright/test';

import { signIn, USERS } from '../support/auth';
import { fillCollectorForm, waitForSummary } from '../support/checkout';
import { emitOrderUpdate, readOrders, seedCart, startApp, switchScenario } from '../support/mocks';

/**
 * Regressao visual do pagamento (1440 e 390) e da confirmacao.
 *
 * As tres capturas partem do MESMO cenario fixo: reset da simulacao, carrinho
 * semeado com itens e quantidades constantes e a mesma conta. Sem isso a
 * baseline dependeria do que sobrou do teste anterior, e os valores calculados
 * pelo servidor mudariam a cada execucao.
 *
 * A confirmacao usa o cenario `payment-manual` e dispara o evento pelo endpoint
 * de controle: assim o recibo aparece em um instante escolhido pelo teste, e
 * nao quando um temporizador resolver — o que tornaria a captura uma corrida.
 */

/** Carrinho da baseline: itens e quantidades fixos, dentro do limite por pedido. */
const BASELINE_CART = [
  { nftId: 'emerald-ape-042', quantity: 2 },
  { nftId: 'violet-nomad-314', quantity: 2 },
  { nftId: 'ivory-baron-088', quantity: 1 },
] as const;

/** Viewports capturados, nos tamanhos que o enunciado §8 pede. */
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
] as const;

/**
 * Congela o que muda entre execucoes antes de capturar.
 *
 * @param page - Pagina do teste.
 */
async function settle(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `*, *::before, *::after { animation: none !important; transition: none !important; }`,
  });
  // A fonte e as artes sao servidas localmente: capturar antes delas chegarem
  // trocaria o desenho do texto e deixaria molduras vazias na baseline.
  await page.waitForLoadState('networkidle');
}

for (const viewport of VIEWPORTS) {
  test.describe(`regressao visual do pagamento (${viewport.name})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test('pagamento', async ({ page }) => {
      await startApp(page, 'default');
      await seedCart(page, BASELINE_CART);
      await signIn(page, USERS.ana);

      await page.goto('/pagamento');

      // O frame de 414 nao traz as linhas de valor — so o total, e o resumo
      // fica recolhido. Abri-lo para esperar mudaria a captura, entao a espera
      // e diferente em cada composicao.
      if (viewport.name === 'mobile') {
        await expect(page.getByTestId('checkout-mobile-total')).not.toHaveText('(-) 00.00');
      } else {
        await waitForSummary(page);
      }

      await settle(page);

      await expect(page).toHaveScreenshot(`pagamento-${viewport.name}.png`, { fullPage: true });
    });
  });
}

test.describe('regressao visual da confirmacao', () => {
  test('recibo do pedido confirmado', async ({ page }) => {
    await startApp(page, 'default');
    await seedCart(page, BASELINE_CART);
    await signIn(page, USERS.ana);

    // Pagamento pendente ate o teste mandar: o recibo aparece na hora exata.
    await switchScenario(page, 'payment-manual');
    await page.goto('/pagamento');
    await waitForSummary(page);
    await fillCollectorForm(page);
    await page.getByTestId('checkout-submit').click();

    await expect(page.getByTestId('order-pending')).toBeVisible();

    const [order] = await readOrders(page);
    await emitOrderUpdate(page, { orderId: order.id, status: 'confirmed' });

    const dialog = page.getByTestId('receipt-dialog');
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId('receipt-line')).toHaveCount(BASELINE_CART.length);
    await settle(page);

    // Hash e data mudam a cada compra: mascarar mantem a baseline estavel sem
    // abrir mao de conferir o resto da composicao.
    await expect(dialog).toHaveScreenshot('confirmacao-desktop.png', {
      mask: [page.getByTestId('receipt-transaction-id'), page.getByTestId('receipt-date')],
    });
  });
});
