import { expect, type Page } from '@playwright/test';

/**
 * Atalhos das telas de conta (perfil e carteiras).
 *
 * Cada helper opera pela interface, como o usuario faria — nenhum escreve em
 * storage nem no cache do TanStack Query. O que eles poupam e repeticao de
 * preenchimento, nao o comportamento sob teste.
 */

/**
 * PNG de 1x1 usado no teste de avatar.
 * A imagem e minima de proposito: o que esta sob teste e o caminho
 * selecao -> previa -> mutation -> persistencia, nao o conteudo do arquivo.
 */
const PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

/**
 * Abre a tela de perfil e espera o formulario.
 *
 * @param page - Pagina do teste, ja autenticada.
 */
export async function openProfile(page: Page): Promise<void> {
  await page.goto('/perfil');
  await expect(page.getByTestId('profile-form')).toBeVisible();
}

/**
 * Abre a tela de carteiras e espera o bloco da principal.
 *
 * @param page - Pagina do teste, ja autenticada.
 */
export async function openWallets(page: Page): Promise<void> {
  await page.goto('/carteiras');
  await expect(page.getByTestId('wallet-primary-form')).toBeVisible();
}

/**
 * Garante que a navegacao da conta esteja alcancavel.
 *
 * Abaixo de `md` a barra lateral e um `<details>` recolhido (ver ARCHITECTURE
 * §5e): sem abri-lo, os itens nao existem para o teste — nem para o usuario.
 * No desktop a barra ja esta aberta e o helper nao faz nada.
 *
 * @param page - Pagina do teste, com uma tela da conta aberta.
 */
export async function openAccountNav(page: Page): Promise<void> {
  const disclosure = page.getByTestId('account-nav-mobile');
  if ((await disclosure.count()) === 0) return;

  await disclosure.locator('summary').click();
  await expect(disclosure).toHaveAttribute('open', '');
}

/**
 * Escolhe um arquivo no seletor de avatar.
 *
 * @param page - Pagina do teste, com o perfil aberto.
 * @param name - Nome do arquivo enviado.
 * @param mimeType - Tipo declarado (permite exercitar a recusa por formato).
 */
export async function chooseAvatar(
  page: Page,
  name = 'avatar.png',
  mimeType = 'image/png',
): Promise<void> {
  await page.getByTestId('avatar-input').setInputFiles({ name, mimeType, buffer: PIXEL_PNG });
}

/** Campos de um bloco de carteira, no formato que o formulario recebe. */
export interface WalletFormInput {
  displayName: string;
  label: string;
  network: string;
  profileName: string;
  address: string;
  provider: string;
  referralCode: string;
  email: string;
  ensLabel: string;
}

/** Valores validos de uma carteira nova — cada teste sobrescreve o que exercita. */
export const VALID_WALLET: WalletFormInput = {
  displayName: 'Bruno Salles',
  label: 'Reserva do Bruno',
  network: 'Polygon',
  profileName: 'bruno.reserva',
  address: '0x1234567890abcdef1234567890abcdef12345678',
  provider: 'MetaMask',
  referralCode: 'KURIO-BRU2',
  email: 'bruno@kurio.dev',
  ensLabel: 'reserva',
};

/**
 * Preenche um bloco de carteira.
 *
 * @param page - Pagina do teste, com as carteiras abertas.
 * @param role - `primary` ou `secondary` (define os ids dos campos).
 * @param values - Valores a digitar; ausentes ficam como estao.
 */
export async function fillWalletForm(
  page: Page,
  role: 'primary' | 'secondary',
  values: Partial<WalletFormInput>,
): Promise<void> {
  const prefix = `#wallet-${role}`;

  /**
   * Preenche um campo de texto, quando o teste informou um valor.
   *
   * @param suffix - Sufixo do id do campo.
   * @param value - Texto a digitar.
   */
  const fill = async (suffix: string, value: string | undefined): Promise<void> => {
    if (value === undefined) return;
    await page.locator(`${prefix}-${suffix}`).fill(value);
  };

  await fill('display-name', values.displayName);
  await fill('label', values.label);
  await fill('profile-name', values.profileName);
  await fill('address', values.address);
  await fill('referral-code', values.referralCode);
  await fill('email', values.email);
  await fill('ens-name', values.ensLabel);

  if (values.network !== undefined) {
    await page.locator(`${prefix}-network`).selectOption({ label: values.network });
  }
  if (values.provider !== undefined) {
    await page.locator(`${prefix}-provider`).selectOption({ label: values.provider });
  }
}

/**
 * Envia um bloco de carteira.
 *
 * @param page - Pagina do teste.
 * @param role - Bloco a enviar.
 */
export async function submitWallet(page: Page, role: 'primary' | 'secondary'): Promise<void> {
  await page
    .getByTestId(`wallet-${role}-form`)
    .getByRole('button', { name: 'Salvar carteira' })
    .click();
}

/**
 * Le as carteiras do usuario autenticado pela propria API.
 *
 * Serve para o teste afirmar sobre o SERVIDOR (o que ficou gravado, e de quem)
 * sem depender do que a tela esta mostrando.
 *
 * @param page - Pagina do teste, ja autenticada.
 * @returns Carteiras do usuario corrente.
 */
export async function readWallets(
  page: Page,
): Promise<{ id: string; role: string; label: string; address: string }[]> {
  return page.evaluate(async () => {
    const token = localStorage.getItem('kurio:session-token') ?? '';
    const response = await fetch('/api/wallets', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error(`Leitura de carteiras falhou: ${String(response.status)}`);
    const body = (await response.json()) as {
      items: { id: string; role: string; label: string; address: string }[];
    };
    return body.items;
  });
}
