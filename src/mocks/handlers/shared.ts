import { ENV } from '@/constants/env';
import { resolveOwner, resolveSession } from '@/mocks/db/session';
import { getDatabase } from '@/mocks/db/store';
import { unauthenticated } from '@/mocks/lib/responses';
import type { MockDatabase, SessionRecord, UserRecord } from '@/mocks/types/db';

/**
 * Utilitarios compartilhados pelos handlers REST.
 *
 * Concentram o que se repetiria em todo endpoint: montar a URL a partir da base
 * configurada, exigir sessao valida e resolver o dono dos dados. Handler nenhum
 * escreve resposta de 401 na mao.
 */

/**
 * Monta a URL absoluta (ou o caminho) de um endpoint a partir da base do app.
 *
 * @param path - Caminho do recurso, comecando com `/`.
 * @returns URL usada no registro do handler.
 */
export function apiUrl(path: string): string {
  return `${ENV.apiBaseUrl}${path}`;
}

/** Sessao ativa resolvida com sucesso. */
interface ActiveSession {
  db: MockDatabase;
  user: UserRecord;
  session: SessionRecord;
}

/**
 * Exige sessao valida.
 *
 * @param request - Requisicao interceptada.
 * @returns Sessao ativa, ou a resposta `401` a devolver ao cliente.
 */
export function requireSession(request: Request): ActiveSession | { response: Response } {
  const db = getDatabase();
  const resolution = resolveSession(db, request);

  if (resolution.status === 'active') {
    return { db, user: resolution.user, session: resolution.session };
  }

  if (resolution.status === 'expired') {
    return {
      response: unauthenticated('SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente.'),
    };
  }

  return { response: unauthenticated(undefined, 'Entre na sua conta para continuar.') };
}

/**
 * Type guard que separa a sessao ativa da resposta de erro.
 *
 * @param result - Retorno de `requireSession`.
 * @returns `true` quando ha sessao ativa.
 */
export function isActiveSession(
  result: ActiveSession | { response: Response },
): result is ActiveSession {
  return 'user' in result;
}

/** Dono dos dados resolvido com sucesso (usuario autenticado ou visitante). */
interface ResolvedOwner {
  db: MockDatabase;
  ownerId: string;
  /** Presente apenas quando ha usuario autenticado. */
  user: UserRecord | null;
}

/**
 * Resolve o dono dos dados, aceitando visitante.
 * Usado pelo carrinho e pela cotacao, que funcionam antes do login.
 *
 * @param request - Requisicao interceptada.
 * @returns Dono resolvido, ou a resposta `401` quando a sessao enviada nao vale.
 */
export function requireOwner(request: Request): ResolvedOwner | { response: Response } {
  const db = getDatabase();
  const resolution = resolveOwner(db, request);

  if (resolution.status === 'user') {
    return { db, ownerId: resolution.ownerId, user: resolution.user };
  }

  if (resolution.status === 'guest') {
    return { db, ownerId: resolution.ownerId, user: null };
  }

  if (resolution.status === 'expired') {
    return {
      response: unauthenticated('SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente.'),
    };
  }

  return { response: unauthenticated(undefined, 'Sua sessão não é mais válida.') };
}

/**
 * Type guard que separa o dono resolvido da resposta de erro.
 *
 * @param result - Retorno de `requireOwner`.
 * @returns `true` quando o dono foi resolvido.
 */
export function isResolvedOwner(
  result: ResolvedOwner | { response: Response },
): result is ResolvedOwner {
  return 'ownerId' in result;
}

/**
 * Le o corpo JSON da requisicao sem lancar.
 *
 * @param request - Requisicao interceptada.
 * @returns Corpo tipado, ou `null` quando ausente/invalido.
 */
export async function readJsonBody<TBody>(request: Request): Promise<TBody | null> {
  try {
    return (await request.json()) as TBody;
  } catch {
    return null;
  }
}
