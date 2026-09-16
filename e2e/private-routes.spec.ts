import { expect, test } from './support/test';

import { openProfileFromMenu, signIn, submitLogin, USERS } from './support/auth';
import { expireSessions, startApp } from './support/mocks';

/**
 * Protecao das rotas privadas: acesso direto, refresh, retomada do destino e
 * expiracao durante a navegacao.
 */
test.describe('rotas privadas', () => {
  test.beforeEach(async ({ page }) => {
    await startApp(page);
  });

  test('acesso direto sem sessao vai para o login guardando o destino', async ({ page }) => {
    await page.goto('/perfil');

    await expect(page).toHaveURL(/auth=entrar/);
    await expect(page).toHaveURL(/redirect=%2Fperfil/);
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeHidden();
  });

  test('apos entrar, o fluxo interrompido e retomado', async ({ page }) => {
    await page.goto('/perfil');
    await submitLogin(page, USERS.ana);

    await expect(page).toHaveURL(/\/perfil$/);
    await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible();
    await expect(page.locator('#profile-email')).toHaveValue(USERS.ana.email);
  });

  test('refresh de rota protegida mantem o acesso', async ({ page }) => {
    await signIn(page, USERS.ana);
    await page.goto('/perfil');
    await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible();

    await page.reload();

    await expect(page).toHaveURL(/\/perfil$/);
    await expect(page.locator('#profile-username')).toHaveValue(USERS.ana.username);
  });

  test('expiracao durante a navegacao leva ao login e retoma o destino', async ({ page }) => {
    await signIn(page, USERS.ana);
    await expireSessions(page);

    // Navegacao dentro do app: a revalidacao da sessao encontra o 401.
    await openProfileFromMenu(page);

    await expect(page).toHaveURL(/auth=entrar/);
    await expect(page).toHaveURL(/redirect=%2Fperfil/);
    await expect(page.getByRole('dialog').getByText(/sessão expirou/i)).toBeVisible();

    await submitLogin(page, USERS.ana);

    await expect(page).toHaveURL(/\/perfil$/);
    await expect(page.locator('#profile-email')).toHaveValue(USERS.ana.email);
  });

  test('expiracao descoberta no refresh tambem preserva o destino', async ({ page }) => {
    await signIn(page, USERS.ana);
    await page.goto('/perfil');
    await expireSessions(page);

    await page.reload();

    await expect(page).toHaveURL(/auth=entrar/);
    await expect(page).toHaveURL(/redirect=%2Fperfil/);
  });
});
