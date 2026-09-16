import { expect, test } from './support/test';

import { emitNftUpdate, startApp } from './support/mocks';

/** Prazo do primeiro render — o app so aparece depois do worker do MSW. */
const BOOT_TIMEOUT_MS = 20_000;

/**
 * Smoke da fundacao.
 *
 * Garante que as duas cadeias de integracao estao ligadas na tela de verdade:
 * REST (TanStack Router -> Query -> Axios -> MSW) e tempo real
 * (`socket.io-client` -> binding Socket.IO do MSW). Os fluxos de negocio vivem
 * nos specs das features; aqui fica o que sustenta todos eles.
 */
test.describe('fundacao', () => {
  test('a Inicio renderiza o catalogo servido pela API simulada', async ({ page }) => {
    await startApp(page);

    await expect(page.getByTestId('hero')).toBeVisible();
    await expect(page.getByTestId('nft-grid')).toBeVisible();
    await expect(page.getByTestId('nft-card')).toHaveCount(9);
  });

  test('estado simulado de uma semeadura antiga e descartado no carregamento', async ({
    page,
  }) => {
    // Reproduz o que acontece com quem ja abriu o app antes de as fixtures
    // mudarem: o `localStorage` guarda um acervo que nao existe mais — itens a
    // menos e artes que foram renomeadas, que viram 404 no card.
    const stale = JSON.stringify({
      schemaVersion: 2,
      seedSignature: 'desatualizada',
      scenarioId: 'default',
      database: { nfts: [], collections: [], users: [], sequences: {} },
    });
    await page.addInitScript(
      `localStorage.setItem('kurio:mock-state', ${JSON.stringify(stale)});`,
    );

    const notFound: string[] = [];
    page.on('response', (response) => {
      if (response.status() === 404) notFound.push(response.url());
    });

    await page.goto('/');
    // Prazo folgado como no `startApp`: o primeiro render espera o registro do
    // service worker, que varia com a suite inteira em paralelo.
    await expect(page.getByTestId('app-shell')).toBeAttached({ timeout: BOOT_TIMEOUT_MS });
    await expect(page.getByTestId('nft-card')).toHaveCount(9, { timeout: BOOT_TIMEOUT_MS });

    // A assinatura da semeadura nao bateu, entao o estado foi refeito do zero: o
    // catalogo corrente aparece inteiro, com as quatro paginas, e nenhuma arte
    // aponta para arquivo que nao existe mais.
    await expect(page.getByRole('button', { name: 'Página 4' })).toBeVisible();
    expect(notFound).toEqual([]);
  });

  test('o socket.io-client entrega eventos do servidor simulado', async ({ page }) => {
    await startApp(page, 'default', '/nft/emerald-ape-042');
    await expect(page.getByTestId('detail-price')).toHaveText('1.19 ETH');

    await emitNftUpdate(page, { nftId: 'emerald-ape-042', price: '3.33' });

    // Se o preco muda sem refetch, o evento percorreu servidor -> socket -> cache.
    await expect(page.getByTestId('detail-price')).toHaveText('3.33 ETH');
  });

  test('acesso direto a uma rota inexistente cai no 404 da aplicacao', async ({ page }) => {
    await page.goto('/rota-que-nao-existe');

    await expect(page.getByRole('heading', { level: 1, name: /não encontrada/i })).toBeVisible();
  });

  test('o link de pular para o conteudo so aparece quando recebe foco', async ({ page }) => {
    await page.goto('/');

    const skipLink = page.getByRole('link', { name: 'Pular para o conteúdo' });

    // Fora de foco ele existe no DOM para leitores de tela, mas nao ocupa espaco.
    await expect(skipLink).toHaveClass(/skip-link/);

    await skipLink.focus();

    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();
    // Ele leva ao inicio do conteudo principal.
    await expect(skipLink).toHaveAttribute('href', '#main');
  });
});
