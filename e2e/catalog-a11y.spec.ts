import { expect, test } from './support/test';

import { startApp } from './support/mocks';

/**
 * Acessibilidade do catálogo e do detalhe (cenário 11 do enunciado, na parte
 * que cabe a esta fase): operação por teclado, semântica dos controles e
 * feedback anunciado.
 *
 * Os controles são verificados pelo **papel** de propósito: se um filtro fosse
 * uma `div` clicável, nenhuma destas buscas encontraria nada.
 */
test.describe('acessibilidade do catálogo', () => {
  test.beforeEach(async ({ page }) => {
    await startApp(page, 'default', '/mercado');
  });

  test('os filtros são botões com estado anunciado', async ({ page }) => {
    const trigger = page.getByRole('button', { name: /^Filtros/ });
    if (await trigger.isVisible()) await trigger.click();

    const scope = (await trigger.isVisible())
      ? page.getByRole('dialog')
      : page.getByTestId('catalog-sidebar');

    const ethereum = scope.getByRole('button', { name: /^Ethereum/ });
    await expect(ethereum).toHaveAttribute('aria-pressed', 'false');

    // Acionamento por teclado, e não por clique.
    await ethereum.focus();
    await expect(ethereum).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/networks=ethereum/);
    await expect(scope.getByRole('button', { name: /^Ethereum/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('a paginação é operável por teclado e marca a página atual', async ({ page }) => {
    const nextPage = page.getByRole('button', { name: 'Página 2' });

    await nextPage.focus();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByRole('button', { name: 'Página 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    // O foco continua no controle de paginação, não volta para o topo da página.
    await expect(page.getByRole('button', { name: 'Página 2' })).toBeFocused();
  });

  test('o recorte do catálogo é acionável por teclado e anuncia o estado', async ({ page }) => {
    const all = page.getByRole('button', { name: 'Todos os NFTs' });
    const news = page.getByRole('button', { name: 'Novos lançamentos' });

    await expect(all).toHaveAttribute('aria-pressed', 'true');

    await news.focus();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/tab=new/);
    await expect(news).toHaveAttribute('aria-pressed', 'true');
    await expect(all).toHaveAttribute('aria-pressed', 'false');
  });

  test('a mudança de resultado é anunciada por região viva', async ({ page }) => {
    const status = page.getByRole('status').filter({ hasText: /NFTs? encontrados?/ });

    await expect(status).toContainText('Página 1 de 4');

    await page.getByRole('button', { name: 'Página 2' }).click();

    await expect(status).toContainText('Página 2 de 4');
  });

  test('as artes do catálogo têm alternativa textual', async ({ page }) => {
    const cards = page.getByTestId('nft-card');

    for (const card of await cards.all()) {
      // A alternativa precisa DESCREVER a peça, e nao apenas repetir um rotulo
      // generico: quatro artes servem nove NFTs, entao "arte do NFT X" faria
      // imagens distintas soarem iguais. O contrato e "<nome>, da colecao <X>:
      // <descricao da arte>" (ver ARTWORK_DESCRIPTIONS nas fixtures).
      const name = (await card.getByRole('heading').innerText()).trim();
      const alt = await card.locator('img').getAttribute('alt');

      expect(alt).toContain(name);
      expect(alt).toMatch(/, da coleção .+: .+/);
      // Descricao de verdade, e nao so o nome repetido.
      expect((alt ?? '').length).toBeGreaterThan(name.length + 40);
    }
  });

  test('o detalhe abre a arte em diálogo com foco preso e retorno', async ({ page }) => {
    await page.goto('/nft/emerald-ape-042');

    const zoom = page.getByRole('button', { name: 'Abrir a arte em tamanho cheio' });
    await zoom.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(dialog).toBeHidden();
    // O foco volta para quem abriu, e não para o corpo do documento.
    await expect(zoom).toBeFocused();
  });
});
