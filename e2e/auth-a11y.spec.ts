import { expect, test } from '@playwright/test';

import { USERS } from './support/auth';
import { startApp } from './support/mocks';

/**
 * Cenario 11 do enunciado, na parte que esta fase entrega: operacao por
 * teclado, controle de foco no dialogo e validacao de formulario.
 */
test.describe('acessibilidade do painel de autenticacao', () => {
  test.beforeEach(async ({ page }) => {
    await startApp(page);
  });

  test('abre por teclado, prende o foco e devolve ao fechar com Esc', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'Entrar', exact: true });
    await trigger.focus();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // O foco entra no dialogo e nao escapa para o conteudo de tras: a cada Tab,
    // o elemento focado continua dentro do conteudo do dialogo.
    const dialogContent = page.locator('[data-slot="dialog-content"]');
    for (let step = 0; step < 12; step += 1) {
      await page.keyboard.press('Tab');
      await expect(dialogContent.locator(':focus')).toHaveCount(1);
    }

    await page.keyboard.press('Escape');

    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('as abas sao operaveis por teclado e trocam o formulario', async ({ page }) => {
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('tab', { name: 'Entrar' }).focus();
    await page.keyboard.press('ArrowRight');

    await expect(dialog.getByRole('tab', { name: 'Criar conta' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(dialog.getByLabel('Confirmar senha')).toBeVisible();
    await expect(page).toHaveURL(/auth=criar-conta/);
  });

  test('erros de validacao ficam associados aos campos', async ({ page }) => {
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Entrar', exact: true }).click();

    const email = dialog.getByLabel('E-mail');
    await expect(email).toHaveAttribute('aria-invalid', 'true');

    const describedBy = await email.getAttribute('aria-describedby');
    expect(describedBy).not.toBeNull();
    await expect(page.locator(`#${String(describedBy)}`)).toHaveText('Informe seu e-mail.');
    await expect(dialog.getByRole('alert')).toHaveText('Verifique os campos destacados.');
  });

  test('a senha alterna entre oculta e visivel pelo teclado', async ({ page }) => {
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();

    const dialog = page.getByRole('dialog');
    const password = dialog.getByLabel('Senha', { exact: true });
    await password.fill(USERS.ana.password);
    await expect(password).toHaveAttribute('type', 'password');

    const toggle = dialog.getByRole('button', { name: 'Mostrar senha' });
    await toggle.focus();
    await page.keyboard.press('Enter');

    await expect(password).toHaveAttribute('type', 'text');
    await expect(dialog.getByRole('button', { name: 'Ocultar senha' })).toBeFocused();
  });

  test('as acoes fora do escopo avisam em vez de simular sucesso', async ({ page }) => {
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Continuar com Google' }).click();

    await expect(page.getByText(/não faz parte desta demonstração/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Minha conta' })).toBeHidden();
  });
});
