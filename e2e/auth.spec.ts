import { expect, test } from './support/test';

import {
  openProfileFromMenu,
  openSignUpForm,
  SIGN_UP_SUBMIT,
  signIn,
  signOut,
  submitLogin,
  USERS,
} from './support/auth';
import { startApp } from './support/mocks';

/**
 * Cenario 3 do enunciado: cadastro, login, expiracao de sessao, logout e troca
 * de usuario. Cada teste parte de um estado isolado (contexto novo + reset da
 * simulacao) e opera pela interface, como o usuario.
 */
test.describe('sessao e conta', () => {
  test.beforeEach(async ({ page }) => {
    await startApp(page);
  });

  test('cadastro cria a conta e ja abre a sessao', async ({ page }) => {
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();

    const dialog = page.getByRole('dialog');
    await openSignUpForm(page);

    await dialog.getByLabel('Nome de usuário').fill('nova.colecionadora');
    await dialog.getByLabel('E-mail').fill('nova@kurio.dev');
    await dialog.getByLabel('Senha', { exact: true }).fill('kurio12345');
    await dialog.getByLabel('Confirmar senha').fill('kurio12345');
    await dialog.getByRole('button', { name: SIGN_UP_SUBMIT }).click();

    await expect(page.getByRole('button', { name: 'Minha conta' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Minha conta' })).toContainText(
      'nova.colecionadora',
    );
    await expect(dialog).toBeHidden();
  });

  test('cadastro com e-mail ja registrado mostra o conflito no campo', async ({ page }) => {
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();

    const dialog = page.getByRole('dialog');
    await openSignUpForm(page);

    await dialog.getByLabel('Nome de usuário').fill('outra.pessoa');
    await dialog.getByLabel('E-mail').fill(USERS.ana.email);
    await dialog.getByLabel('Senha', { exact: true }).fill('kurio12345');
    await dialog.getByLabel('Confirmar senha').fill('kurio12345');
    await dialog.getByRole('button', { name: SIGN_UP_SUBMIT }).click();

    const emailField = dialog.getByLabel('E-mail');
    await expect(emailField).toHaveAttribute('aria-invalid', 'true');
    await expect(dialog.getByText('Este e-mail já tem uma conta na Kurio.')).toBeVisible();
    // Conflito nao abre sessao: o painel segue aberto e nao ha menu de conta.
    await expect(dialog).toBeVisible();
    await expect(page.getByRole('button', { name: 'Minha conta' })).toBeHidden();
  });

  test('login com credenciais validas abre a sessao', async ({ page }) => {
    await signIn(page, USERS.ana);

    await expect(page.getByRole('button', { name: 'Minha conta' })).toContainText(
      USERS.ana.username,
    );
  });

  test('credencial invalida mostra o erro e mantem o visitante', async ({ page }) => {
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await submitLogin(page, { email: USERS.ana.email, password: 'senha-errada' });

    await expect(page.getByRole('dialog').getByRole('alert')).toHaveText(
      'E-mail ou senha incorretos.',
    );
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('a sessao sobrevive ao refresh', async ({ page }) => {
    await signIn(page, USERS.ana);

    await page.reload();

    await expect(page.getByRole('button', { name: 'Minha conta' })).toContainText(
      USERS.ana.username,
    );
  });

  test('logout encerra a sessao e fecha o acesso privado', async ({ page }) => {
    await signIn(page, USERS.ana);
    await signOut(page);

    await page.goto('/perfil');

    await expect(page).toHaveURL(/auth=entrar/);
    await expect(page).toHaveURL(/redirect=%2Fperfil/);
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('envio em andamento desabilita o botao e impede o duplo-submit', async ({ page }) => {
    // Cenario lento: a latencia (1200-2600 ms) deixa o estado pendente observavel.
    await startApp(page, 'slow');

    let loginRequests = 0;
    page.on('request', (request) => {
      if (request.method() === 'POST' && request.url().endsWith('/auth/login')) loginRequests += 1;
    });

    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('E-mail').fill(USERS.ana.email);
    await dialog.getByLabel('Senha', { exact: true }).fill(USERS.ana.password);

    const submit = dialog.getByRole('button', { name: /Entrar|Entrando/ });
    await submit.click();

    await expect(submit).toBeDisabled();
    await expect(submit).toHaveText('Entrando...');
    // Segundo clique enquanto pendente nao pode virar outro pedido.
    await submit.click({ force: true, noWaitAfter: true });

    await expect(page.getByRole('button', { name: 'Minha conta' })).toBeVisible({ timeout: 15_000 });
    expect(loginRequests).toBe(1);
  });

  test('troca de usuario nao deixa dados do anterior aparecerem', async ({ page }) => {
    await signIn(page, USERS.ana);
    await openProfileFromMenu(page);
    await expect(page.locator('#profile-email')).toHaveValue(USERS.ana.email);

    await signOut(page);
    await signIn(page, USERS.bruno);
    await openProfileFromMenu(page);

    await expect(page.locator('#profile-email')).toHaveValue(USERS.bruno.email);
    await expect(page.locator('#profile-username')).toHaveValue(USERS.bruno.username);
    await expect(page.getByText(USERS.ana.email)).toBeHidden();
  });
});
