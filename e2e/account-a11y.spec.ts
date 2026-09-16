import { expect, test } from '@playwright/test';

import { openAccountNav, openProfile, openWallets } from './support/account';
import { signIn, USERS } from './support/auth';
import { startApp, switchScenario } from './support/mocks';

/**
 * Acessibilidade das telas de conta — cenario 11 do enunciado aplicado ao
 * perfil e as carteiras: navegacao por teclado, foco visivel, rotulos e erros
 * associados aos campos.
 *
 * As afirmacoes sao sobre a ARVORE DE ACESSIBILIDADE (papel, nome, estado), e
 * nao sobre classes de CSS: e o que o leitor de tela consome.
 */

test.describe('navegacao por teclado', () => {
  test('os campos do perfil sao alcancaveis e tem rotulo e foco visivel', async ({ page }) => {
    await startApp(page, 'default');
    await signIn(page, USERS.ana);
    await openProfile(page);

    // Cada campo do frame tem nome acessivel — inclusive os que o design
    // desenha so com placeholder.
    await expect(page.getByLabel('Nome de exibição')).toBeVisible();
    await expect(page.getByLabel('Nome de usuário')).toBeVisible();
    await expect(page.getByLabel('Apelido da carteira')).toBeVisible();
    await expect(page.getByLabel('Rótulo do nome ENS')).toBeVisible();
    await expect(page.getByLabel('Alterar', { exact: true })).toHaveAttribute('type', 'file');

    const displayName = page.locator('#profile-display-name');
    await displayName.focus();
    await expect(displayName).toBeFocused();
    // `:focus-visible` e requisito de a11y mesmo sem hover no Figma.
    await expect(displayName).toHaveCSS('outline-style', /solid|auto/);

    // O olho de mostrar/ocultar e um botao de verdade, com estado anunciado.
    const toggle = page
      .getByRole('button', { name: /Mostrar senha|Ocultar senha/ })
      .first();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#profile-current-password')).toHaveAttribute('type', 'text');
  });

  test('os selects e o radio das carteiras operam por teclado', async ({ page }) => {
    await startApp(page, 'default');
    await signIn(page, USERS.bruno);
    await openWallets(page);

    const network = page.locator('#wallet-primary-network');
    await network.focus();
    await expect(network).toBeFocused();
    await network.selectOption('polygon');
    await expect(network).toHaveValue('polygon');

    const radio = page.getByTestId('wallet-same-as-primary');
    await radio.focus();
    await expect(radio).toBeFocused();
    // O radio tem a explicacao associada — nao e um controle mudo.
    await expect(radio).toHaveAttribute('aria-describedby', 'wallet-same-as-primary-hint');
  });
});

test.describe('secoes fora do escopo', () => {
  test('sao alcancaveis, anunciam indisponibilidade e nao navegam', async ({ page }) => {
    await startApp(page, 'default');
    await signIn(page, USERS.ana);
    await openProfile(page);
    await openAccountNav(page);

    const accountNav = page.getByRole('navigation', { name: 'Seções da minha conta' });
    const activity = accountNav.getByRole('button', { name: /Atividade/ });

    // `aria-disabled` em vez de `disabled`: o item continua na ordem de foco,
    // entao quem navega por teclado ouve POR QUE ele nao leva a lugar nenhum.
    await expect(activity).toHaveAttribute('aria-disabled', 'true');
    await expect(activity).toContainText('em breve');

    await activity.focus();
    await expect(activity).toBeFocused();

    // Acionado pelo teclado (o Playwright recusa clicar em `aria-disabled`, que
    // e exatamente o sinal que se quer ali): o item explica o que e.
    await page.keyboard.press('Enter');
    await expect(page.getByText('não faz parte desta demonstração')).toBeVisible();

    // Nada de sucesso aparente: a URL nao muda e a tela continua a mesma.
    await expect(page).toHaveURL(/\/perfil/);
    await expect(page.getByTestId('profile-form')).toBeVisible();
  });

  test('"Sair" encerra a sessao pela barra lateral', async ({ page }) => {
    await startApp(page, 'default');
    await signIn(page, USERS.ana);
    await openProfile(page);
    await openAccountNav(page);

    await page
      .getByRole('navigation', { name: 'Seções da minha conta' })
      .getByTestId('account-sign-out')
      .click();

    // Rota privada sem sessao: o guard assume e o painel de autenticacao abre.
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByTestId('profile-form')).toHaveCount(0);
  });
});

test.describe('carregamento', () => {
  test('mostra o esqueleto do perfil e das carteiras no cenario lento', async ({ page }) => {
    await startApp(page, 'default');
    await signIn(page, USERS.ana);
    // Sem latencia controlada a resposta chega antes do primeiro sondar do
    // Playwright, e o teste viraria uma corrida com o servidor simulado.
    await switchScenario(page, 'slow');

    await page.goto('/perfil');
    // O esqueleto tem as medidas do conteudo real: ele existe para o formulario
    // pousar no lugar, nao para preencher a espera com um bloco qualquer.
    await expect(page.getByTestId('profile-skeleton')).toBeVisible();
    await expect(page.getByTestId('profile-form')).toBeVisible();

    await page.goto('/carteiras');
    await expect(page.getByTestId('wallets-skeleton')).toBeVisible();
    await expect(page.getByTestId('wallet-primary-form')).toBeVisible();
  });
});
