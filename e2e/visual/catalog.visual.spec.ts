import { expect, test, type Page } from '@playwright/test';

import { startApp } from '../support/mocks';

/**
 * Regressao visual da Inicio e do detalhe, em desktop (1440) e celular (390).
 *
 * As baselines sao versionadas e os dados sao estaveis: cenario `default` +
 * reset antes de cada captura, fixtures com datas fixas e nenhuma animacao
 * continua na tela. As comparacoes ignoram o cursor e desligam animacoes para
 * que a diferenca capturada seja de layout, nao de tempo.
 */

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
  await expect(page.getByTestId('nft-grid-skeleton')).toHaveCount(0);
  await page.addStyleTag({
    content: `*, *::before, *::after { animation: none !important; transition: none !important; }`,
  });
  // A fonte e as artes sao servidas localmente: capturar antes delas chegarem
  // trocaria o desenho do texto e deixaria molduras vazias na baseline.
  await page.waitForLoadState('networkidle');
}

for (const viewport of VIEWPORTS) {
  test.describe(`regressao visual (${viewport.name})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test('inicio', async ({ page }) => {
      await startApp(page, 'default');
      await expect(page.getByTestId('nft-grid')).toBeVisible();
      await settle(page);

      await expect(page).toHaveScreenshot(`inicio-${viewport.name}.png`, { fullPage: true });
    });

    test('detalhe do NFT', async ({ page }) => {
      await startApp(page, 'default', '/nft/emerald-ape-042');
      await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible();
      await settle(page);

      await expect(page).toHaveScreenshot(`detalhe-${viewport.name}.png`, { fullPage: true });
    });
  });
}
