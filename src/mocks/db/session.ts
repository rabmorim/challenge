import { BEARER_PREFIX, GUEST_ID_HEADER } from '@/constants/api';
import type { AuthenticatedUser } from '@/features/auth/types/user';
import type { Session, SessionResponse } from '@/features/auth/types/session';
import { createSessionToken } from '@/mocks/lib/ids';
import type { OwnerResolution, SessionResolution } from '@/mocks/types/auth';
import type { MockDatabase, SessionRecord, UserRecord } from '@/mocks/types/db';
import type { SessionBehavior } from '@/mocks/types/scenario';

/**
 * Sessao do servidor simulado.
 *
 * O token viaja no cabecalho `Authorization` (e nao em cookie) porque o MSW
 * roda tambem em Node, onde nao existe jar de cookies — assim REST, testes e
 * navegador se comportam igual. O cliente guarda apenas o token; senha nunca
 * sai do servidor simulado.
 */

/** Prefixo do `ownerId` de um visitante, para nunca colidir com id de usuario. */
const GUEST_OWNER_PREFIX = 'guest:';

/** Dono usado quando o visitante nao envia identidade — carrinho compartilhado. */
const ANONYMOUS_GUEST_ID = 'anonymous';

/**
 * Cria uma sessao para o usuario.
 * Quando o cenario pede expiracao imediata, a sessao nasce vencida — e o que
 * permite exercitar expiracao durante a navegacao e durante o checkout.
 *
 * @param db - Estado do servidor simulado.
 * @param userId - Dono da sessao.
 * @param behavior - Comportamento de sessao do cenario ativo.
 * @returns Sessao recem-criada, ja registrada no store.
 */
export function createSession(
  db: MockDatabase,
  userId: string,
  behavior: SessionBehavior,
): SessionRecord {
  const issuedAt = new Date();
  const expiresAt = behavior.expireImmediately
    ? new Date(issuedAt.getTime() - 1_000)
    : new Date(issuedAt.getTime() + behavior.ttlMs);

  const session: SessionRecord = {
    token: createSessionToken(),
    userId,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    revokedAt: null,
  };

  db.sessions.push(session);
  return session;
}

/**
 * Le o token do cabecalho `Authorization`.
 *
 * @param request - Requisicao interceptada.
 * @returns Token ou `null` quando o cabecalho esta ausente/malformado.
 */
function readToken(request: Request): string | null {
  const header = request.headers.get('authorization');
  if (!header?.startsWith(BEARER_PREFIX)) return null;

  const token = header.slice(BEARER_PREFIX.length).trim();
  return token.length > 0 ? token : null;
}

/**
 * Resolve a sessao de uma requisicao.
 *
 * @param db - Estado do servidor simulado.
 * @param request - Requisicao interceptada.
 * @returns Estado da sessao: anonima, invalida, expirada ou ativa.
 */
export function resolveSession(db: MockDatabase, request: Request): SessionResolution {
  const token = readToken(request);
  if (!token) return { status: 'anonymous' };

  const session = db.sessions.find((candidate) => candidate.token === token);
  if (!session || session.revokedAt) return { status: 'invalid' };

  if (Date.parse(session.expiresAt) <= Date.now()) return { status: 'expired' };

  const user = db.users.find((candidate) => candidate.id === session.userId);
  if (!user) return { status: 'invalid' };

  return { status: 'active', session, user };
}

/**
 * Resolve o dono dos dados da requisicao (usuario autenticado ou visitante).
 *
 * @param db - Estado do servidor simulado.
 * @param request - Requisicao interceptada.
 * @returns Dono resolvido, ou o motivo pelo qual a sessao nao vale.
 */
export function resolveOwner(db: MockDatabase, request: Request): OwnerResolution {
  const resolution = resolveSession(db, request);

  if (resolution.status === 'active') {
    return {
      status: 'user',
      ownerId: resolution.user.id,
      user: resolution.user,
      session: resolution.session,
    };
  }

  if (resolution.status === 'invalid' || resolution.status === 'expired') return resolution;

  const guestId = request.headers.get(GUEST_ID_HEADER)?.trim();
  return { status: 'guest', ownerId: toGuestOwnerId(guestId) };
}

/**
 * Monta o `ownerId` de um visitante.
 *
 * @param guestId - Identidade enviada no cabecalho `x-guest-id`.
 * @returns Dono prefixado, distinto de qualquer id de usuario.
 */
export function toGuestOwnerId(guestId: string | null | undefined): string {
  return `${GUEST_OWNER_PREFIX}${guestId && guestId.length > 0 ? guestId : ANONYMOUS_GUEST_ID}`;
}

/**
 * Revoga uma sessao (logout). Sessao revogada nao volta a valer.
 *
 * @param db - Estado do servidor simulado.
 * @param token - Token a revogar.
 */
export function revokeSession(db: MockDatabase, token: string): void {
  const session = db.sessions.find((candidate) => candidate.token === token);
  if (!session || session.revokedAt) return;
  session.revokedAt = new Date().toISOString();
}

/**
 * Expira todas as sessoes de um usuario sem esperar o TTL.
 * Usado pelo endpoint de controle que simula expiracao durante a navegacao.
 *
 * @param db - Estado do servidor simulado.
 * @param userId - Dono das sessoes; expira todas quando omitido.
 * @returns Quantidade de sessoes expiradas.
 */
export function expireSessions(db: MockDatabase, userId?: string): number {
  const expiredAt = new Date(Date.now() - 1_000).toISOString();
  let count = 0;

  for (const session of db.sessions) {
    if (session.revokedAt) continue;
    if (userId && session.userId !== userId) continue;
    session.expiresAt = expiredAt;
    count += 1;
  }

  return count;
}

/**
 * Converte o registro de usuario na forma publica do contrato.
 *
 * @param user - Registro interno (contem o hash da senha).
 * @returns Usuario sem nenhum dado sensivel.
 */
export function toAuthenticatedUser(user: UserRecord): AuthenticatedUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}

/**
 * Monta a resposta de sessao consumida por login, cadastro e consulta.
 *
 * @param session - Sessao ativa.
 * @param user - Dono da sessao.
 * @returns Envelope `SessionResponse` do contrato.
 */
export function toSessionResponse(session: SessionRecord, user: UserRecord): SessionResponse {
  const payload: Session = {
    token: session.token,
    userId: session.userId,
    issuedAt: session.issuedAt,
    expiresAt: session.expiresAt,
  };

  return { session: payload, user: toAuthenticatedUser(user) };
}
