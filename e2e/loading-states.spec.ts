import { expect, test } from '@playwright/test';

import { startApp, switchScenario } from './support/mocks';

/**
 * Cenario 12 do enunciado (parte que cabe a esta fase): skeletons durante
 * carregamento lento, feedback de falha e recuperacao apos nova tentativa.
 *
 * A latencia e a falha vem dos cenarios do MSW — nada de `waitForTimeout` nem
 * de rota interceptada no teste: o que esta sendo verificado e o comportamento
 * da interface diante do servidor simulado.
 */
test.describe('carregamento, falha e recuperacao', () => {
  test('o catalogo mostra o esqueleto com shimmer enquanto carrega', async ({ page }) => {
    // Sem esperar o header: o app so renderiza depois do worker do MSW, entao o
    // proprio esqueleto ja e a prova de que a simulacao esta de pe — e esperar
    // duas vezes gastaria a janela de carregamento que este teste observa.
    await startApp(page, 'slow', '/mercado', false);

    // Em rede lenta o esqueleto ocupa a caixa final antes dos dados chegarem.
    await expect(page.getByTestId('nft-grid-skeleton')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('nft-grid')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('nft-grid-skeleton')).toBeHidden();
  });

  test('o detalhe mostra o esqueleto antes do recurso chegar', async ({ page }) => {
    await startApp(page, 'slow', '/nft/emerald-ape-042', false);

    await expect(page.getByTestId('nft-detail-skeleton')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('falha do catalogo mostra o erro e a nova tentativa recupera', async ({ page }) => {
    await startApp(page, 'server-error', '/mercado');

    await expect(page.getByTestId('catalog-error')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('nft-grid')).toBeHidden();

    // O servidor volta a responder; a mesma consulta e refeita pelo botao.
    await switchScenario(page, 'default');
    await page.getByRole('button', { name: 'Tentar novamente' }).click();

    await expect(page.getByTestId('nft-grid')).toBeVisible();
    await expect(page.getByTestId('catalog-error')).toBeHidden();
  });

  test('falha do detalhe mostra o erro e a nova tentativa recupera', async ({ page }) => {
    await startApp(page, 'server-error', '/nft/emerald-ape-042');

    await expect(page.getByTestId('nft-detail-error')).toBeVisible({ timeout: 15_000 });

    await switchScenario(page, 'default');
    await page.getByRole('button', { name: 'Tentar novamente' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible();
  });

  test('catalogo vazio mostra o estado proprio, nao um erro', async ({ page }) => {
    await startApp(page, 'empty', '/mercado');

    await expect(page.getByTestId('catalog-empty')).toBeVisible();
    await expect(page.getByTestId('catalog-error')).toBeHidden();
  });

  test('a troca de filtro mantem os resultados anteriores marcados como desatualizados', async ({
    page,
  }) => {
    await startApp(page, 'slow', '/mercado');

    const grid = page.getByTestId('nft-grid');
    await expect(grid).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: 'Em alta' }).click();

    // A grade anterior continua na tela enquanto a nova consulta corre — e diz
    // isso ao leitor de tela em vez de sumir e voltar.
    await expect(grid).toHaveAttribute('aria-busy', 'true');
    await expect(grid).toHaveAttribute('aria-busy', 'false', { timeout: 15_000 });
  });
});
