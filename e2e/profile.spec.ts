import { expect, test } from './support/test';

import { chooseAvatar, openProfile } from './support/account';
import { signIn, signOut, submitLogin, switchAccount, USERS } from './support/auth';
import { startApp } from './support/mocks';

/**
 * Cenario 8 do enunciado — perfil: edicao dos dados, avatar e troca de senha,
 * com os erros de validacao do cliente e os que vem da API.
 *
 * Cada teste parte de um contexto de navegador novo e de um reset da simulacao,
 * entao nenhum depende do que o anterior gravou.
 */

test.describe('dados do perfil', () => {
  test('edita os dados e a alteracao sobrevive ao refresh', async ({ page }) => {
    await startApp(page, 'default');
    await signIn(page, USERS.ana);
    await openProfile(page);

    await page.locator('#profile-display-name').fill('Ana Ribeiro Costa');
    await page.locator('#profile-wallet-label').fill('Cofre principal');
    await page.locator('#profile-ens-name').fill('anacosta');
    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(page.getByTestId('profile-status')).toHaveText('Dados do perfil salvos.');

    // O que prova a persistencia e o recarregamento: o valor volta do servidor,
    // nao do estado que o formulario ainda tem em memoria.
    await page.reload();
    await expect(page.locator('#profile-display-name')).toHaveValue('Ana Ribeiro Costa');
    await expect(page.locator('#profile-wallet-label')).toHaveValue('Cofre principal');
    await expect(page.locator('#profile-ens-name')).toHaveValue('anacosta');
  });

  test('mostra no campo o conflito de e-mail devolvido pela API', async ({ page }) => {
    await startApp(page, 'default');
    await signIn(page, USERS.ana);
    await openProfile(page);

    // O e-mail do Bruno ja tem dono: o servidor responde 409, e a interface
    // precisa apontar o CAMPO, nao so avisar que algo deu errado.
    await page.locator('#profile-email').fill(USERS.bruno.email);
    await page.getByRole('button', { name: 'Salvar' }).click();

    const error = page.locator('#profile-email-error');
    await expect(error).toBeVisible();
    await expect(page.locator('#profile-email')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#profile-email')).toHaveAttribute(
      'aria-describedby',
      'profile-email-error',
    );

    // Nada foi gravado: o refresh traz o e-mail original de volta.
    await page.reload();
    await expect(page.locator('#profile-email')).toHaveValue(USERS.ana.email);
  });

  test('valida os campos obrigatorios antes de ir a rede', async ({ page }) => {
    await startApp(page, 'default');
    await signIn(page, USERS.ana);
    await openProfile(page);

    await page.locator('#profile-display-name').fill('x');
    await page.locator('#profile-email').fill('sem-arroba');
    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(page.getByTestId('profile-status')).toHaveText('Revise os campos destacados.');
    await expect(page.locator('#profile-display-name-error')).toBeVisible();
    await expect(page.locator('#profile-email-error')).toBeVisible();

    // O erro sai da tela no instante em que deixa de ser verdade.
    await page.locator('#profile-email').fill('ana@kurio.dev');
    await expect(page.locator('#profile-email-error')).toBeHidden();
  });
});

test.describe('avatar', () => {
  test('altera e remove o avatar, e a remocao sobrevive ao refresh', async ({ page }) => {
    await startApp(page, 'default');
    await signIn(page, USERS.ana);
    await openProfile(page);

    const image = page.getByTestId('profile-avatar').locator('img');
    await expect(image).toHaveAttribute('src', '/avatars/collector-ana.png');

    await chooseAvatar(page);
    await expect(image).toHaveAttribute('src', /^data:image\/png/);

    // "Remover" deixa a conta SEM avatar: a imagem some e a inicial ocupa o
    // lugar dela — nao ha alternativa textual para uma imagem inexistente.
    await page.getByTestId('avatar-remove').click();
    await expect(image).toHaveCount(0);
    await expect(page.getByTestId('profile-avatar')).toHaveText('A');

    await page.reload();
    await expect(page.getByTestId('profile-avatar').locator('img')).toHaveCount(0);
  });

  test('recusa arquivo fora dos formatos aceitos sem chamar a API', async ({ page }) => {
    await startApp(page, 'default');
    await signIn(page, USERS.ana);
    await openProfile(page);

    await chooseAvatar(page, 'documento.pdf', 'application/pdf');

    await expect(page.getByRole('alert')).toHaveText(/PNG, JPEG ou WebP/);
    await expect(page.getByTestId('profile-avatar').locator('img')).toHaveAttribute(
      'src',
      '/avatars/collector-ana.png',
    );
  });
});

test.describe('troca de senha', () => {
  test('troca a senha e a nova credencial passa a valer', async ({ page }) => {
    await startApp(page, 'default');
    await signIn(page, USERS.ana);
    await openProfile(page);

    await page.locator('#profile-current-password').fill(USERS.ana.password);
    await page.locator('#profile-new-password').fill('kurio-nova-1');
    await page.locator('#profile-new-password-confirmation').fill('kurio-nova-1');
    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(page.getByTestId('profile-status')).toHaveText('Senha alterada.');
    // A senha nao fica na tela depois de gravada.
    await expect(page.locator('#profile-current-password')).toHaveValue('');
    await expect(page.locator('#profile-new-password')).toHaveValue('');

    // A prova de que a troca valeu e entrar de novo com a credencial nova.
    // Sair de uma rota privada ja abre o painel pelo guard (Fase 2) e guarda o
    // destino — entao aqui nao se clica em "Entrar", so se preenche o painel
    // que o proprio guard abriu, e a volta ao perfil acontece sozinha.
    await signOut(page);
    await expect(page.getByRole('dialog')).toBeVisible();
    await submitLogin(page, { email: USERS.ana.email, password: 'kurio-nova-1' });

    await expect(page.getByTestId('profile-form')).toBeVisible();
    await expect(page).toHaveURL(/\/perfil/);
    await expect(page.locator('#profile-username')).toHaveValue(USERS.ana.username);
  });

  test('recusa no cliente quando a confirmacao nao confere', async ({ page }) => {
    await startApp(page, 'default');
    await signIn(page, USERS.ana);
    await openProfile(page);

    await page.locator('#profile-current-password').fill(USERS.ana.password);
    await page.locator('#profile-new-password').fill('kurio-nova-1');
    await page.locator('#profile-new-password-confirmation').fill('kurio-outra-2');
    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(page.locator('#profile-new-password-confirmation-error')).toHaveText(
      'As senhas não conferem.',
    );
    await expect(page.getByTestId('profile-status')).toHaveText('Revise os campos destacados.');
  });

  test('mostra no campo a senha atual incorreta devolvida pela API', async ({ page }) => {
    await startApp(page, 'default');
    await signIn(page, USERS.ana);
    await openProfile(page);

    // A senha passa na validacao do cliente (tamanho e confirmacao batem): quem
    // recusa e o servidor, e a mensagem dele precisa achar o campo certo.
    await page.locator('#profile-current-password').fill('senha-errada-1');
    await page.locator('#profile-new-password').fill('kurio-nova-1');
    await page.locator('#profile-new-password-confirmation').fill('kurio-nova-1');
    await page.getByRole('button', { name: 'Salvar' }).click();

    const error = page.locator('#profile-current-password-error');
    await expect(error).toBeVisible();
    await expect(error).toHaveText(/[Ss]enha atual incorreta/);
    await expect(page.locator('#profile-current-password')).toHaveAttribute('aria-invalid', 'true');
  });

  test('nao exige senha para salvar apenas os dados', async ({ page }) => {
    await startApp(page, 'default');
    await signIn(page, USERS.ana);
    await openProfile(page);

    await page.locator('#profile-display-name').fill('Ana R.');
    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(page.getByTestId('profile-status')).toHaveText('Dados do perfil salvos.');
    await expect(page.locator('#profile-current-password-error')).toHaveCount(0);
  });
});

test.describe('isolamento entre usuarios', () => {
  test('o perfil editado pela Ana nao aparece para o Bruno', async ({ page }) => {
    await startApp(page, 'default');
    await signIn(page, USERS.ana);
    await openProfile(page);

    await page.locator('#profile-display-name').fill('Ana Editada');
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByTestId('profile-status')).toHaveText('Dados do perfil salvos.');

    await switchAccount(page, USERS.bruno);
    await openProfile(page);

    // A afirmacao e sobre os DOIS lados: o dado do Bruno esta la e o da Ana nao.
    await expect(page.locator('#profile-username')).toHaveValue(USERS.bruno.username);
    await expect(page.locator('#profile-email')).toHaveValue(USERS.bruno.email);
    await expect(page.locator('#profile-display-name')).toHaveValue('Bruno Salles');
    await expect(page.locator('#profile-display-name')).not.toHaveValue('Ana Editada');
    await expect(page.getByTestId('profile-form')).not.toContainText('Ana');
  });
});
