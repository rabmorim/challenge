import { GUEST_ID_STORAGE_KEY, SESSION_TOKEN_STORAGE_KEY } from '@/constants/storage';

/**
 * Identidade que acompanha toda requisicao REST: o token da sessao e, quando
 * nao ha sessao, a identidade do visitante.
 *
 * Vive em `lib` (e nao numa feature) porque e assunto de transporte — quem
 * consome e o interceptor da instancia unica do Axios. O `localStorage` sustenta
 * o refresh; quando ele nao existe (Node/testes) ou esta bloqueado, o valor
 * ainda vale em memoria para a sessao corrente.
 */

/** Espelho em memoria: unica fonte quando o storage nao esta disponivel. */
let sessionToken: string | null = null;

/** Identidade do visitante em memoria. */
let guestId: string | null = null;

/**
 * Devolve o `localStorage` quando utilizavel.
 *
 * @returns Storage ou `null`.
 */
function getStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * Le uma chave do storage sem lancar.
 *
 * @param key - Chave a ler.
 * @returns Valor guardado ou `null`.
 */
function readKey(key: string): string | null {
  try {
    return getStorage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/**
 * Grava (ou remove) uma chave no storage sem lancar.
 *
 * @param key - Chave a gravar.
 * @param value - Valor; `null` remove a chave.
 */
function writeKey(key: string, value: string | null): void {
  try {
    const storage = getStorage();
    if (!storage) return;
    if (value === null) storage.removeItem(key);
    else storage.setItem(key, value);
  } catch {
    // Sem storage o valor vale apenas em memoria.
  }
}

/**
 * Le o token da sessao corrente.
 *
 * @returns Token ou `null` quando nao ha sessao.
 */
export function getSessionToken(): string | null {
  sessionToken ??= readKey(SESSION_TOKEN_STORAGE_KEY);
  return sessionToken;
}

/**
 * Guarda o token da sessao.
 *
 * @param token - Token devolvido pelo login/cadastro.
 */
export function setSessionToken(token: string): void {
  sessionToken = token;
  writeKey(SESSION_TOKEN_STORAGE_KEY, token);
}

/**
 * Descarta o token da sessao (logout, expiracao, troca de usuario).
 */
export function clearSessionToken(): void {
  sessionToken = null;
  writeKey(SESSION_TOKEN_STORAGE_KEY, null);
}

/**
 * Le (criando na primeira vez) a identidade do visitante.
 *
 * @returns Identidade estavel do visitante.
 */
export function getGuestId(): string {
  guestId ??= readKey(GUEST_ID_STORAGE_KEY);

  if (!guestId) {
    guestId = globalThis.crypto.randomUUID();
    writeKey(GUEST_ID_STORAGE_KEY, guestId);
  }

  return guestId;
}

/**
 * Descarta a identidade do visitante.
 * Chamado depois de o carrinho do visitante ser absorvido pela conta, para que
 * a proxima visita anonima comece limpa.
 */
export function clearGuestId(): void {
  guestId = null;
  writeKey(GUEST_ID_STORAGE_KEY, null);
}
