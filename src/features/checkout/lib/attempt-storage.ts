import { CHECKOUT_ATTEMPT_STORAGE_PREFIX } from '@/constants/storage';
import type { CheckoutAttemptRecord } from '@/features/checkout/types/checkout-state';

/**
 * Tentativa de compra gravada no disco.
 *
 * A chave de idempotencia precisa sobreviver ao que a memoria do React nao
 * sobrevive: refresh no meio do envio, aba fechada depois de um timeout, queda
 * de conexao com pedido pendente. Por isso ela e gravada ANTES de a requisicao
 * sair — se a resposta se perder, o reenvio ainda encontra a mesma chave e o
 * servidor devolve o mesmo pedido em vez de criar um segundo.
 *
 * O registro e por usuario: a chave de uma conta nunca pode ser reaproveitada
 * na sessao de outra (o servidor guarda a chave junto com o dono, e o
 * isolamento tem que valer nos dois lados).
 *
 * Toda leitura e escrita tolera falha do `localStorage` (navegacao privada,
 * armazenamento bloqueado): sem registro a compra continua funcionando — o que
 * se perde e so a retomada apos refresh.
 */

/**
 * Monta a chave de armazenamento da tentativa de um usuario.
 *
 * @param userId - Dono da tentativa.
 * @returns Chave do `localStorage`.
 */
function storageKey(userId: string): string {
  return `${CHECKOUT_ATTEMPT_STORAGE_PREFIX}${userId}`;
}

/**
 * Confere se o valor lido do disco tem a forma de um registro de tentativa.
 *
 * @param value - Valor desserializado.
 * @returns `true` quando o registro pode ser usado.
 */
function isAttemptRecord(value: unknown): value is CheckoutAttemptRecord {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<CheckoutAttemptRecord>;
  return typeof candidate.key === 'string' && typeof candidate.fingerprint === 'string';
}

/**
 * Le a tentativa gravada de um usuario.
 *
 * @param userId - Dono da tentativa.
 * @returns Registro gravado, ou `null` quando nao ha nenhum utilizavel.
 */
export function readAttempt(userId: string): CheckoutAttemptRecord | null {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    return isAttemptRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Grava a tentativa de um usuario.
 *
 * @param userId - Dono da tentativa.
 * @param record - Registro a persistir.
 */
export function writeAttempt(userId: string, record: CheckoutAttemptRecord): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(record));
  } catch {
    // Armazenamento indisponivel: a compra segue, so a retomada apos refresh
    // deixa de existir.
  }
}

/**
 * Apaga a tentativa de um usuario (estado terminal ou troca de sessao).
 *
 * @param userId - Dono da tentativa.
 */
export function clearAttempt(userId: string): void {
  try {
    localStorage.removeItem(storageKey(userId));
  } catch {
    // Nada a fazer: sem armazenamento nao havia registro para apagar.
  }
}

/** Apaga as tentativas de todos os usuarios — usado no logout e na expiracao. */
export function clearAllAttempts(): void {
  try {
    const keys = Object.keys(localStorage).filter((key) =>
      key.startsWith(CHECKOUT_ATTEMPT_STORAGE_PREFIX),
    );
    for (const key of keys) localStorage.removeItem(key);
  } catch {
    // Ver `clearAttempt`.
  }
}
