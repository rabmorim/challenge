import type { Page } from '@playwright/test';

import { expect, test } from './support/test';

import { expectAuthPanelOpen, signIn, signOut, USERS } from './support/auth';
import { startApp, switchScenario } from './support/mocks';

/**
 * Cenario 4 do enunciado: favoritos, incluindo falha de mutation e recuperacao
 * do estado.
 *
 * O update e otimista — o coracao muda antes da resposta —, entao os testes
 * verificam as duas pontas: o efeito imediato e o rollback quando o servidor
 * recusa.
 */

/**
 * Botao de favoritar de um NFT especifico.
 *
 * @param page - Pagina do teste.
 * @param nftId - Id do NFT.
 * @returns Locator do botao.
 */
function favoriteButton(page: Page, nftId: string) {
  // O mesmo NFT pode aparecer em mais de um lugar (grade, destaque, detalhe);
  // `first()` fixa o teste no primeiro, que e o do conteudo principal.
  return page.locator(`[data-testid="favorite-button"][data-nft="${nftId}"]`).first();
}

/**
 * Espera a resposta da mutation de favorito.
 *
 * O update e otimista: o coracao muda antes do servidor confirmar. Recarregar
 * nesse intervalo cancelaria a requisicao em voo e o teste cobraria uma
 * persistencia que nunca chegou a acontecer.
 *
 * @param page - Pagina do teste.
 * @returns Promessa da resposta da mutation.
 */
function waitForFavoriteMutation(page: Page): Promise<unknown> {
  return page.waitForResponse(
    (response) =>
      response.url().includes('/api/favorites') &&
      ['POST', 'DELETE'].includes(response.request().method()),
  );
}

test.describe('favoritos', () => {
  test('visitante que tenta favoritar e levado ao painel de autenticacao', async ({ page }) => {
    await startApp(page, 'default', '/nft/emerald-ape-042');

    await favoriteButton(page, 'emerald-ape-042').click();

    await expectAuthPanelOpen(page);
    // Nada foi favoritado: o botao continua desmarcado atras do painel.
    await expect(favoriteButton(page, 'emerald-ape-042')).toHaveAttribute('aria-pressed', 'false');
  });

  test('favoritar marca o item, anuncia a mudanca e sobrevive ao refresh', async ({ page }) => {
    // `sage-nomad-009` nao esta nos favoritos semeados da Ana.
    // A sessao comeca na Inicio: no frame de 414 o detalhe nao desenha a barra
    // de atalhos (o rodape e da barra de compra), entao o controle de conta so
    // existe fora dele.
    await startApp(page, 'default');
    await signIn(page, USERS.ana);
    await page.goto('/nft/sage-nomad-009');

    const button = favoriteButton(page, 'sage-nomad-009');
    await expect(button).toHaveAttribute('aria-pressed', 'false');

    const saved = waitForFavoriteMutation(page);
    await button.click();

    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('NFT adicionado aos favoritos.').first()).toBeVisible();

    await saved;
    await page.reload();

    await expect(favoriteButton(page, 'sage-nomad-009')).toHaveAttribute('aria-pressed', 'true');
  });

  test('desfavoritar volta o estado e persiste', async ({ page }) => {
    // `ana` ja tem `neon-vessel-552` nos favoritos semeados.
    await startApp(page, 'default');
    await signIn(page, USERS.ana);
    await page.goto('/nft/neon-vessel-552');

    const button = favoriteButton(page, 'neon-vessel-552');
    await expect(button).toHaveAttribute('aria-pressed', 'true');

    const saved = waitForFavoriteMutation(page);
    await button.click();

    await expect(button).toHaveAttribute('aria-pressed', 'false');

    await saved;
    await page.reload();

    await expect(favoriteButton(page, 'neon-vessel-552')).toHaveAttribute('aria-pressed', 'false');
  });

  test('falha da mutation desfaz o update otimista e avisa', async ({ page }) => {
    await startApp(page, 'default');
    await signIn(page, USERS.ana);
    await page.goto('/nft/sage-nomad-009');

    const button = favoriteButton(page, 'sage-nomad-009');
    await expect(button).toHaveAttribute('aria-pressed', 'false');

    // Só as mutations passam a falhar: a leitura continua de pe, que e o que
    // permite ver o rollback acontecer.
    await switchScenario(page, 'favorite-error');

    await button.click();

    // O rollback devolve exatamente o estado anterior...
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    // ...e a falha e comunicada por dois canais: o toast visivel e a regiao
    // viva que o leitor de tela anuncia. `first()` porque a mensagem e a mesma.
    await expect(page.getByText(/Não foi possível atualizar seus favoritos/).first()).toBeVisible();

    // Recuperacao: com a rede saudavel de novo, a mesma acao funciona.
    await switchScenario(page, 'default');
    await button.click();

    await expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  test('favoritos nao vazam entre usuarios', async ({ page }) => {
    // O Mercado filtrado pelo item, e nao o detalhe: e a tela onde o coracao e
    // o controle de conta convivem nos dois frames, e a troca de usuario
    // precisa acontecer SEM recarregar — um `goto` limparia o cache e o teste
    // deixaria de cobrar o vazamento que ele existe para cobrar.
    await startApp(page, 'default', '/mercado?search=Neon+Vessel');

    await signIn(page, USERS.ana);
    await expect(favoriteButton(page, 'neon-vessel-552')).toHaveAttribute('aria-pressed', 'true');

    await signOut(page);
    await signIn(page, USERS.bruno);

    // O favorito semeado e da Ana; o Bruno nao pode herda-lo do cache.
    await expect(favoriteButton(page, 'neon-vessel-552')).toHaveAttribute('aria-pressed', 'false');
  });

  test('a tela de favoritos exige sessao e lista o que foi marcado', async ({ page }) => {
    await startApp(page, 'default');

    // Rota privada: sem sessao, o guard leva ao painel guardando o destino.
    await page.goto('/favoritos');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page).toHaveURL(/redirect=%2Ffavoritos/);

    await page.getByRole('dialog').getByLabel('E-mail').fill(USERS.ana.email);
    await page.getByRole('dialog').getByLabel('Senha', { exact: true }).fill(USERS.ana.password);
    await page.getByRole('dialog').getByRole('button', { name: 'Entrar', exact: true }).click();

    await expect(page).toHaveURL(/\/favoritos/);
    await expect(page.getByRole('heading', { level: 1, name: 'Meus favoritos' })).toBeVisible();
    await expect(page.getByTestId('nft-card')).not.toHaveCount(0);
  });
});
