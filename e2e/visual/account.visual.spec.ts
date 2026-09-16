import type { Page } from '@playwright/test';

import { expect, test } from '../support/test';

import { openProfile, openWallets } from '../support/account';
import { signIn, USERS } from '../support/auth';
import { startApp } from '../support/mocks';

/**
 * Regressao visual do perfil e das carteiras (1440 e 390).
 *
 * As capturas partem do MESMO cenario fixo: reset da simulacao e a conta da
 * Ana, que tem as duas carteiras semeadas — com ela os dois blocos do frame
 * aparecem preenchidos, e nenhum valor depende do que o teste anterior gravou.
 *
 * O celular nao tem frame no Figma: a baseline de 390 registra a adaptacao
 * documentada no ARCHITECTURE (barra lateral recolhida em `<details>`), para
 * que uma mudanca nela apareca na revisao em vez de passar batido.
 */

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
  // A fonte e os avatares sao servidos localmente: capturar antes deles
  // chegarem trocaria o desenho do texto e deixaria molduras vazias.
  await page.waitForLoadState('networkidle');
}

for (const viewport of VIEWPORTS) {
  test.describe(`regressao visual da conta (${viewport.name})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test('perfil do colecionador', async ({ page }) => {
      await startApp(page, 'default');
      await signIn(page, USERS.ana);
      await openProfile(page);
      await settle(page);

      await expect(page).toHaveScreenshot(`perfil-${viewport.name}.png`, { fullPage: true });
    });

    test('carteiras', async ({ page }) => {
      await startApp(page, 'default');
      await signIn(page, USERS.ana);
      await openWallets(page);
      await expect(page.getByTestId('wallet-secondary-form')).toBeVisible();
      await settle(page);

      await expect(page).toHaveScreenshot(`carteiras-${viewport.name}.png`, { fullPage: true });
    });
  });
}
