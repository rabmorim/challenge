import { expect, test, type Page } from '@playwright/test';

import { seedCart, startApp } from '../support/mocks';

/**
 * Regressao visual do carrinho, em desktop (1440) e celular (390).
 *
 * As duas capturas partem do MESMO cenario fixo: reset da simulacao + um
 * carrinho semeado com itens e quantidades constantes. Sem isso a baseline
 * dependeria de quantos itens sobraram do teste anterior, e valores calculados
 * pelo servidor (subtotal, taxa, total) mudariam a cada execucao.
 */

/** Carrinho da baseline: itens e quantidades fixos. */
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
 * Prepara a pagina para a captura.
 *
 * Espera o conteudo dependente de dados chegar — capturar com esqueleto na tela
 * produziria baselines instaveis — e desliga animacoes remanescentes.
 *
 * @param page - Pagina do teste.
 */
async function settle(page: Page): Promise<void> {
  await expect(page.getByTestId('cart-skeleton')).toHaveCount(0);
  await expect(page.getByTestId('cart-summary-skeleton')).toHaveCount(0);
  await page.addStyleTag({
    content: `*, *::before, *::after { animation: none !important; transition: none !important; }`,
  });
  // A fonte e as artes sao servidas localmente: capturar antes delas chegarem
  // trocaria o desenho do texto e deixaria molduras vazias na baseline.
  await page.waitForLoadState('networkidle');
}

for (const viewport of VIEWPORTS) {
  test.describe(`regressao visual do carrinho (${viewport.name})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test('carrinho', async ({ page }) => {
      await startApp(page, 'default');
      await seedCart(page, BASELINE_CART);

      await page.goto('/carrinho');
      await expect(page.getByTestId('cart-row')).toHaveCount(BASELINE_CART.length);
      await expect(page.getByTestId('summary-total')).toBeVisible();
      await settle(page);

      await expect(page).toHaveScreenshot(`carrinho-${viewport.name}.png`, { fullPage: true });
    });
  });
}
