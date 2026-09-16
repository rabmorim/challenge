import { expect, type Page } from '@playwright/test';

/**
 * Atalhos dos fluxos de sessao usados pelos testes de interface.
 * Cada helper opera pela interface (como o usuario faria), nunca escrevendo em
 * storage ou cache — e o comportamento que precisa ser verificado.
 */

/** Credenciais ficticias semeadas pelas fixtures (ver README da solucao). */
export const USERS = {
  ana: { email: 'ana@kurio.dev', password: 'kurio1234', username: 'ana.colecionadora' },
  bruno: { email: 'bruno@kurio.dev', password: 'kurio4321', username: 'bruno.mint' },
} as const;

/** Usuario das fixtures. */
export type SeededUser = (typeof USERS)[keyof typeof USERS];

/**
 * Abre o painel de autenticacao pelo botao do header.
 *
 * @param page - Pagina do teste.
 */
export async function openAuthPanel(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

/**
 * Preenche e envia o formulario de login.
 *
 * @param page - Pagina do teste.
 * @param credentials - E-mail e senha a usar.
 */
export async function submitLogin(
  page: Page,
  credentials: { email: string; password: string },
): Promise<void> {
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('E-mail').fill(credentials.email);
  await dialog.getByLabel('Senha', { exact: true }).fill(credentials.password);
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click();
}

/**
 * Entra na conta a partir do header, do inicio ao fim.
 *
 * @param page - Pagina do teste.
 * @param user - Usuario semeado.
 */
export async function signIn(page: Page, user: SeededUser): Promise<void> {
  await openAuthPanel(page);
  await submitLogin(page, user);
  await expect(page.getByRole('button', { name: 'Minha conta' })).toBeVisible();
}

/**
 * Sai da conta pelo menu do header.
 *
 * Sair de uma rota PRIVADA deixa o painel de autenticacao aberto pelo guard
 * (Fase 2). Quem for entrar com outra conta em seguida precisa sair dessa rota
 * antes — ver `switchAccount`.
 *
 * @param page - Pagina do teste.
 */
export async function signOut(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Minha conta' }).click();
  await page.getByRole('menuitem', { name: 'Sair' }).click();
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible();
}

/**
 * Abre o perfil pelo menu da conta (navegacao dentro do app).
 *
 * @param page - Pagina do teste.
 */
export async function openProfileFromMenu(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Minha conta' }).click();
  await page.getByRole('menuitem', { name: 'Meu perfil' }).click();
}

/**
 * Troca de conta a partir de uma tela privada.
 *
 * Sai, volta para a Inicio e entra com o outro usuario. A passagem pela Inicio
 * nao e detalhe de teste: sair de uma rota privada deixa o painel aberto pelo
 * guard, e tentar abri-lo de novo seria clicar num botao que o proprio painel
 * cobre. Sair da rota protegida e o que o usuario faria, e torna a sequencia
 * deterministica.
 *
 * @param page - Pagina do teste, autenticada e numa tela privada.
 * @param user - Conta que assume a sessao.
 */
export async function switchAccount(page: Page, user: SeededUser): Promise<void> {
  await signOut(page);
  await page.goto('/');
  await signIn(page, user);
}
