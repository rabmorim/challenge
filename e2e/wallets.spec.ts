import { expect, test } from '@playwright/test';

import { fillWalletForm, openWallets, readWallets, submitWallet, VALID_WALLET } from './support/account';
import { signIn, switchAccount, USERS } from './support/auth';
import { seedCart, startApp } from './support/mocks';

/**
 * Cenario 8 do enunciado — carteiras: cadastro e edicao da principal e da
 * secundaria, o atalho "Igual a carteira principal", os erros de validacao e a
 * consistencia com o pagamento.
 *
 * O Bruno e a conta escolhida para os cadastros porque so tem a principal
 * semeada: com ele o bloco da secundaria comeca vazio, que e o estado que o
 * frame desenha.
 */

test.describe('cadastro e edicao', () => {
  test('cadastra a secundaria e ela sobrevive ao refresh', async ({ page }) => {
    await startApp(page, 'default');
    await signIn(page, USERS.bruno);
    await openWallets(page);

    await expect(page.getByTestId('wallet-secondary-empty')).toBeVisible();
    await page.getByTestId('wallet-secondary-add').click();

    await fillWalletForm(page, 'secondary', VALID_WALLET);
    await submitWallet(page, 'secondary');

    await expect(page.getByTestId('wallets-status')).toHaveText('Carteira secundária cadastrada.');

    // O que prova a persistencia e o recarregamento: os valores voltam do
    // servidor, e o estado vazio nao reaparece.
    await page.reload();
    await expect(page.getByTestId('wallet-secondary-form')).toBeVisible();
    await expect(page.getByTestId('wallet-secondary-empty')).toHaveCount(0);
    await expect(page.locator('#wallet-secondary-label')).toHaveValue(VALID_WALLET.label);
    await expect(page.locator('#wallet-secondary-address')).toHaveValue(VALID_WALLET.address);
    await expect(page.locator('#wallet-secondary-ens-name')).toHaveValue(VALID_WALLET.ensLabel);
  });

  test('atualiza a carteira principal e persiste', async ({ page }) => {
    await startApp(page, 'default');
    await signIn(page, USERS.bruno);
    await openWallets(page);

    await expect(page.locator('#wallet-primary-label')).toHaveValue('Coinbase pessoal');
    await fillWalletForm(page, 'primary', { label: 'Cofre do Bruno', network: 'Solana' });
    await submitWallet(page, 'primary');

    await expect(page.getByTestId('wallets-status')).toHaveText('Carteira principal atualizada.');

    await page.reload();
    await expect(page.locator('#wallet-primary-label')).toHaveValue('Cofre do Bruno');
    await expect(page.locator('#wallet-primary-network')).toHaveValue('solana');

    // O servidor e quem confirma: a carteira continua sendo a MESMA (atualizada,
    // nao duplicada) e segue sendo a principal.
    const wallets = await readWallets(page);
    expect(wallets).toHaveLength(1);
    expect(wallets[0]).toMatchObject({ role: 'primary', label: 'Cofre do Bruno' });
  });
});

test.describe('igual a carteira principal', () => {
  test('copia os dados da principal menos o endereco', async ({ page }) => {
    await startApp(page, 'default');
    await signIn(page, USERS.bruno);
    await openWallets(page);

    await page.getByTestId('wallet-same-as-primary').click();

    await expect(page.getByTestId('wallets-status')).toContainText('Dados copiados');
    await expect(page.locator('#wallet-secondary-label')).toHaveValue('Coinbase pessoal');
    await expect(page.locator('#wallet-secondary-profile-name')).toHaveValue('bruno.mint');
    await expect(page.locator('#wallet-secondary-network')).toHaveValue('ethereum');
    await expect(page.locator('#wallet-secondary-referral-code')).toHaveValue('KURIO-BRU1');

    // O ENDERECO fica vazio de proposito: o servidor recusa endereco repetido do
    // mesmo dono, entao copia-lo ofereceria um atalho que falharia no envio.
    await expect(page.locator('#wallet-secondary-address')).toHaveValue('');

    await page.locator('#wallet-secondary-address').fill(VALID_WALLET.address);
    await submitWallet(page, 'secondary');

    await expect(page.getByTestId('wallets-status')).toHaveText('Carteira secundária cadastrada.');

    const wallets = await readWallets(page);
    expect(wallets).toHaveLength(2);
    expect(wallets.map((wallet) => wallet.role).toSorted()).toEqual(['primary', 'secondary']);
  });

  test('recusa no servidor quando o endereco repete o da principal', async ({ page }) => {
    await startApp(page, 'default');
    await signIn(page, USERS.bruno);
    await openWallets(page);

    await page.getByTestId('wallet-same-as-primary').click();
    // Digitar o endereco da principal a mao e o caminho que o atalho evita: o
    // 409 do servidor precisa achar o campo, e nao so avisar que algo falhou.
    await page
      .locator('#wallet-secondary-address')
      .fill('0x6b29f8d4c07e13a5924d8b6f0c3a7e15d82946bf');
    await submitWallet(page, 'secondary');

    const error = page.locator('#wallet-secondary-address-error');
    await expect(error).toBeVisible();
    await expect(page.locator('#wallet-secondary-address')).toHaveAttribute('aria-invalid', 'true');

    // Nada foi gravado.
    expect(await readWallets(page)).toHaveLength(1);
  });
});

test.describe('validacao', () => {
  test('aponta os campos invalidos antes de ir a rede', async ({ page }) => {
    await startApp(page, 'default');
    await signIn(page, USERS.bruno);
    await openWallets(page);

    await page.getByTestId('wallet-secondary-add').click();
    await fillWalletForm(page, 'secondary', {
      ...VALID_WALLET,
      label: 'x',
      address: '0x123',
      email: 'sem-arroba',
      referralCode: 'ab',
    });
    await submitWallet(page, 'secondary');

    await expect(page.getByTestId('wallets-status')).toHaveText('Revise os campos destacados.');
    await expect(page.locator('#wallet-secondary-label-error')).toBeVisible();
    await expect(page.locator('#wallet-secondary-address-error')).toBeVisible();
    await expect(page.locator('#wallet-secondary-email-error')).toBeVisible();
    await expect(page.locator('#wallet-secondary-referral-code-error')).toBeVisible();

    // Nenhuma requisicao saiu: o servidor continua com uma carteira so.
    expect(await readWallets(page)).toHaveLength(1);

    // O erro sai do campo assim que ele deixa de estar errado.
    await page.locator('#wallet-secondary-address').fill(VALID_WALLET.address);
    await expect(page.locator('#wallet-secondary-address-error')).toBeHidden();
  });
});

test.describe('consistencia com o pagamento', () => {
  test('a carteira cadastrada aqui passa a existir no pagamento', async ({ page }) => {
    await startApp(page, 'default');
    await seedCart(page, [{ nftId: 'emerald-ape-042', quantity: 1 }]);
    await signIn(page, USERS.bruno);

    // As duas composicoes do pagamento mostram as carteiras de formas
    // diferentes: 1440 marca o provedor escolhido, 414 lista cartoes com o
    // apelido. A afirmacao acompanha o frame de cada faixa.
    const isCompact = (page.viewportSize()?.width ?? 0) < 768;

    if (!isCompact) {
      // Antes: o Bruno so tem a Coinbase, entao escolher MetaMask cai no estado
      // "voce nao tem uma carteira desse provedor".
      await page.goto('/pagamento');
      await page.getByTestId('wallet-provider-metamask').click();
      await expect(page.getByTestId('wallet-missing')).toContainText('MetaMask');
    }

    await openWallets(page);
    await page.getByTestId('wallet-secondary-add').click();
    await fillWalletForm(page, 'secondary', {
      ...VALID_WALLET,
      label: 'Carteira do checkout',
      provider: 'MetaMask',
    });
    await submitWallet(page, 'secondary');
    await expect(page.getByTestId('wallets-status')).toHaveText('Carteira secundária cadastrada.');

    // Depois: as duas telas leem o MESMO recurso, na mesma entrada de cache —
    // a carteira recem-salva esta la sem nenhuma sincronizacao entre elas.
    await page.goto('/pagamento?etapa=carteira');

    if (isCompact) {
      await expect(page.getByTestId('connected-wallets')).toContainText('Carteira do checkout');
      return;
    }

    await page.getByTestId('wallet-provider-metamask').click();
    await expect(page.getByTestId('wallet-missing')).toHaveCount(0);
  });
});

test.describe('isolamento entre usuarios', () => {
  test('a carteira do Bruno nao aparece para a Ana', async ({ page }) => {
    await startApp(page, 'default');
    await signIn(page, USERS.bruno);
    await openWallets(page);

    await page.getByTestId('wallet-secondary-add').click();
    await fillWalletForm(page, 'secondary', { ...VALID_WALLET, label: 'Segredo do Bruno' });
    await submitWallet(page, 'secondary');
    await expect(page.getByTestId('wallets-status')).toHaveText('Carteira secundária cadastrada.');

    await switchAccount(page, USERS.ana);
    await openWallets(page);

    // A afirmacao e sobre os DOIS lados: as carteiras da Ana estao la e as do
    // Bruno nao — nem o rotulo, nem o endereco.
    await expect(page.locator('#wallet-primary-label')).toHaveValue('Principal');
    await expect(page.locator('#wallet-secondary-label')).toHaveValue('Reserva');
    await expect(page.getByText('Segredo do Bruno')).toHaveCount(0);
    await expect(page.locator(`input[value="${VALID_WALLET.address}"]`)).toHaveCount(0);

    const wallets = await readWallets(page);
    expect(wallets.map((wallet) => wallet.label).toSorted()).toEqual(['Principal', 'Reserva']);
  });
});
