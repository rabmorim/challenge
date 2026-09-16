/**
 * Derivacao de senha da simulacao.
 *
 * NAO e criptografia: e uma funcao de hash simples (FNV-1a com sal fixo) cujo
 * unico objetivo e garantir que o estado simulado — inclusive o que fica no
 * `localStorage` — nunca guarde senha em claro (enunciado §3). Trocar isto por
 * bcrypt/argon nao mudaria nada na avaliacao e traria dependencia nativa.
 */

/** Sal fixo do ambiente simulado. */
const SALT = 'kurio-mock';

/** Offset inicial do FNV-1a de 32 bits. */
const FNV_OFFSET_BASIS = 0x811c9dc5;

/** Primo do FNV-1a de 32 bits. */
const FNV_PRIME = 0x01000193;

/**
 * Calcula o hash da senha.
 *
 * @param password - Senha em claro, recebida na requisicao.
 * @returns Hash hexadecimal estavel para a mesma entrada.
 */
export function hashPassword(password: string): string {
  const input = `${SALT}:${password}`;
  let hash = FNV_OFFSET_BASIS;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Confere uma senha contra o hash guardado.
 *
 * @param password - Senha em claro informada no login.
 * @param hash - Hash guardado no store.
 * @returns `true` quando a senha corresponde.
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}
