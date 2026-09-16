import type { Page } from '@playwright/test';

import { expect, test } from './support/test';

import { startApp } from './support/mocks';

/**
 * Cenario 1 do enunciado: busca, filtros combinados, ordenacao, paginacao e
 * restauracao pelo historico.
 *
 * Todas as verificacoes passam pela interface e pela URL — o estado de consulta
 * mora na barra de enderecos, entao e nela que "sobrevive ao refresh e ao
 * historico" pode ser conferido de verdade.
 */

/**
 * Nomes dos cards atualmente na grade.
 *
 * Espera o fim da atualizacao em segundo plano: enquanto a consulta nova esta
 * em voo, a grade anterior continua na tela marcada com `aria-busy` — ler ali
 * devolveria o resultado do filtro antigo.
 *
 * @param page - Pagina do teste.
 * @returns Nomes dos NFTs exibidos.
 */
async function cardNames(page: Page): Promise<string[]> {
  const grid = page.getByTestId('nft-grid');
  await expect(grid).toBeVisible();
  await expect(grid).toHaveAttribute('aria-busy', 'false');
  return page.getByTestId('nft-card').locator('h3').allInnerTexts();
}

/**
 * Digita na busca e envia.
 *
 * No desktop o frame mostra so a lupa, que revela o campo; no celular o campo
 * ja esta na tela. O helper cobre os dois caminhos para o mesmo teste rodar nos
 * dois viewports.
 *
 * @param page - Pagina do teste.
 * @param term - Termo buscado.
 */
async function searchFor(page: Page, term: string): Promise<void> {
  const toggle = page.getByRole('button', { name: 'Buscar NFTs' });
  if (await toggle.isVisible()) await toggle.click();

  const field = page.getByRole('searchbox', { name: 'Buscar NFTs' }).first();
  await field.fill(term);
  await field.press('Enter');
}

/**
 * Abre a coluna de filtros.
 *
 * No desktop ela ja esta na tela; em telas estreitas o frame a coloca atras de
 * um botao, entao o teste abre a gaveta antes de usar os filtros.
 *
 * @param page - Pagina do teste.
 * @returns Escopo onde os filtros estao visiveis.
 */
async function openFilters(page: Page) {
  // O gatilho da gaveta anuncia tambem quantos filtros estao ativos ("Filtros
  // 2 filtros ativos"), entao o casamento e por prefixo — e o prefixo tambem
  // evita pegar o "Limpar filtros" da propria coluna.
  const trigger = page.getByRole('button', { name: /^Filtros/ });

  if (await trigger.isVisible()) {
    await trigger.click();
    return page.getByRole('dialog');
  }

  return page.getByTestId('catalog-sidebar');
}

/**
 * Fecha a gaveta de filtros quando ela existe (telas estreitas).
 *
 * @param page - Pagina do teste.
 */
async function closeFilters(page: Page): Promise<void> {
  const drawer = page.getByRole('dialog');
  if (await drawer.isVisible()) {
    await drawer.getByRole('button', { name: 'Ver resultados' }).click();
    await expect(drawer).toBeHidden();
  }
}

test.describe('catalogo: busca, filtros, ordenacao e paginacao', () => {
  test.beforeEach(async ({ page }) => {
    await startApp(page, 'default', '/mercado');
  });

  test('a primeira pagina mostra o catalogo completo paginado', async ({ page }) => {
    await expect(page.getByTestId('nft-card')).toHaveCount(9);
    await expect(page.getByTestId('catalog-pagination')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Página 1' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('a busca compoe a URL e filtra os resultados', async ({ page }) => {
    await searchFor(page, 'golden');

    await expect(page).toHaveURL(/search=golden/);
    const names = await cardNames(page);
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((name) => name.toLowerCase().includes('golden'))).toBe(true);
  });

  test('a busca sobrevive ao refresh', async ({ page }) => {
    await page.goto('/mercado?search=golden');
    const before = await cardNames(page);

    await page.reload();

    await expect(page).toHaveURL(/search=golden/);
    expect(await cardNames(page)).toEqual(before);
  });

  test('filtros sao combinaveis e reiniciam a paginacao', async ({ page }) => {
    // Comeca em uma pagina diferente da primeira, para provar o reinicio.
    await page.getByRole('button', { name: 'Página 2' }).click();
    await expect(page).toHaveURL(/page=2/);

    const filters = await openFilters(page);
    await filters.getByRole('button', { name: /^Ethereum/ }).click();
    await closeFilters(page);

    await expect(page).toHaveURL(/networks=ethereum/);
    await expect(page).not.toHaveURL(/page=2/);
    const onlyNetwork = await cardNames(page);

    const filters2 = await openFilters(page);
    await filters2.getByRole('button', { name: /^Arte digital/ }).click();
    await closeFilters(page);

    await expect(page).toHaveURL(/networks=ethereum/);
    await expect(page).toHaveURL(/collections=digital-art/);

    // Os dois filtros se somam: o par traz menos itens que um filtro so — e
    // continua trazendo itens.
    const combined = await cardNames(page);
    expect(combined.length).toBeGreaterThan(0);
    expect(combined.length).toBeLessThan(onlyNetwork.length);

    // E somam mesmo, em vez de um sobrescrever o outro: desmarcar so a colecao
    // devolve exatamente a grade que a rede sozinha mostrava.
    const filters3 = await openFilters(page);
    await filters3.getByRole('button', { name: /^Arte digital/ }).click();
    await closeFilters(page);

    await expect(page).not.toHaveURL(/collections=/);
    await expect(page).toHaveURL(/networks=ethereum/);
    expect(await cardNames(page)).toEqual(onlyNetwork);
  });

  test('a ordenacao muda a sequencia e viaja na URL', async ({ page }) => {
    // No frame de 414 a ordenacao mora dentro da gaveta de filtros, junto do
    // resto da consulta; no de 1440 ela fica na barra acima da grade.
    const trigger = page.getByRole('button', { name: /^Filtros/ });
    if (await trigger.isVisible()) await trigger.click();

    await page.getByRole('button', { name: /Ordenar por/ }).click();
    await page.getByRole('menuitemradio', { name: 'Menor preço' }).click();
    await closeFilters(page);

    await expect(page).toHaveURL(/sort=price-asc/);

    // Espera a grade parar de atualizar antes de ler; so o preco corrente
    // interessa (o riscado da promocao tambem tem "ETH" no texto).
    await cardNames(page);
    const prices = await page.getByTestId('nft-price').allInnerTexts();
    const values = prices.map((text) => Number.parseFloat(text));

    expect(values).toEqual([...values].toSorted((left, right) => left - right));
  });

  test('paginacao troca os itens e o historico restaura o estado anterior', async ({ page }) => {
    const firstPage = await cardNames(page);

    await page.getByRole('button', { name: 'Página 2' }).click();
    await expect(page).toHaveURL(/page=2/);

    const secondPage = await cardNames(page);
    expect(secondPage).not.toEqual(firstPage);

    await page.goBack();

    await expect(page).not.toHaveURL(/page=2/);
    expect(await cardNames(page)).toEqual(firstPage);

    await page.goForward();

    await expect(page).toHaveURL(/page=2/);
    expect(await cardNames(page)).toEqual(secondPage);
  });

  test('busca sem resultado mostra o estado vazio com saida', async ({ page }) => {
    await page.goto('/mercado?search=inexistente');

    await expect(page.getByTestId('catalog-empty')).toBeVisible();
    await expect(page.getByTestId('nft-grid')).toBeHidden();

    await page.getByTestId('catalog-empty').getByRole('button', { name: 'Limpar filtros' }).click();

    await expect(page.getByTestId('nft-grid')).toBeVisible();
    await expect(page).not.toHaveURL(/search=/);
  });

  test('o recorte selecionado muda o catalogo e fica na URL', async ({ page }) => {
    await page.getByRole('button', { name: 'Em alta' }).click();

    await expect(page).toHaveURL(/tab=trending/);
    await expect(page.getByRole('button', { name: 'Em alta' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await page.reload();

    await expect(page.getByRole('button', { name: 'Em alta' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('respostas fora de ordem nao sobrescrevem o filtro mais recente', async ({ page }) => {
    await startApp(page, 'out-of-order', '/mercado');

    // Duas consultas em sequencia rapida, com latencia sorteada: a resposta da
    // primeira pode chegar depois da segunda, e nao pode ganhar a tela.
    await page.goto('/mercado?search=golden');
    await page.goto('/mercado?search=emerald');

    await expect(page.getByTestId('nft-grid')).toBeVisible();
    const names = await cardNames(page);

    expect(names.length).toBeGreaterThan(0);
    expect(names.every((name) => name.toLowerCase().includes('emerald'))).toBe(true);
  });
});
