import { HttpResponse, http, type HttpHandler } from 'msw';

import { API_PATTERNS, GUEST_ID_HEADER } from '@/constants/api';
import type {
  LoginRequest,
  LogoutResponse,
  SessionResponse,
  SignUpRequest,
} from '@/features/auth/types/session';
import {
  DEFAULT_AVATAR_URL,
  DEFAULT_WALLET_LABEL,
  MIN_PASSWORD_LENGTH,
  MIN_USERNAME_LENGTH,
} from '@/mocks/constants';
import { mergeCarts } from '@/mocks/db/cart';
import { hashPassword, verifyPassword } from '@/mocks/db/password';
import {
  createSession,
  resolveSession,
  revokeSession,
  toGuestOwnerId,
  toSessionResponse,
} from '@/mocks/db/session';
import { commitDatabase, getDatabase } from '@/mocks/db/store';
import { conflict, unauthenticated, validationError } from '@/mocks/lib/responses';
import { createUserId } from '@/mocks/lib/ids';
import { getActiveScenario } from '@/mocks/scenarios/active';
import { applyNetworkBehavior } from '@/mocks/scenarios/network';
import { apiUrl, isActiveSession, readJsonBody, requireSession } from '@/mocks/handlers/shared';
import type { MockDatabase } from '@/mocks/types/db';

/**
 * Sessao e conta: cadastro, login, consulta da sessao e logout.
 *
 * O carrinho do visitante e transferido para a conta no login e no cadastro
 * (cabecalho `x-guest-id`), o que preserva os itens de quem monta a compra
 * antes de entrar.
 */

/**
 * Valida o corpo do cadastro.
 *
 * @param db - Estado do servidor simulado.
 * @param body - Corpo recebido.
 * @returns Erros por campo (vazio quando esta tudo valido).
 */
function validateSignUp(db: MockDatabase, body: SignUpRequest): Record<string, string> {
  const errors: Record<string, string> = {};

  if (body.username.trim().length < MIN_USERNAME_LENGTH) {
    errors.username = `Use ao menos ${String(MIN_USERNAME_LENGTH)} caracteres.`;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.email = 'Informe um e-mail válido.';
  }

  if (body.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `A senha precisa de ao menos ${String(MIN_PASSWORD_LENGTH)} caracteres.`;
  }

  if (body.password !== body.passwordConfirmation) {
    errors.passwordConfirmation = 'As senhas não conferem.';
  }

  if (db.users.some((user) => user.username.toLowerCase() === body.username.trim().toLowerCase())) {
    errors.username = 'Este nome de usuário já está em uso.';
  }

  return errors;
}

/**
 * Transfere o carrinho do visitante para a conta autenticada.
 *
 * @param db - Estado do servidor simulado.
 * @param request - Requisicao (traz `x-guest-id`).
 * @param userId - Conta de destino.
 */
function absorbGuestCart(db: MockDatabase, request: Request, userId: string): void {
  const guestId = request.headers.get(GUEST_ID_HEADER)?.trim();
  if (!guestId) return;
  mergeCarts(db, toGuestOwnerId(guestId), userId);
}

/** Handlers de sessao e conta. */
export const authHandlers: HttpHandler[] = [
  http.post(apiUrl(API_PATTERNS.signUp), async ({ request }) => {
    const failure = await applyNetworkBehavior();
    if (failure) return failure;

    const body = await readJsonBody<SignUpRequest>(request);
    if (!body) return validationError({ form: 'Corpo da requisição inválido.' });

    const db = getDatabase();
    const scenario = getActiveScenario();

    if (scenario.account.forceSignUpConflict) {
      return conflict('EMAIL_ALREADY_REGISTERED', 'Este e-mail já tem uma conta na Kurio.');
    }

    const errors = validateSignUp(db, body);
    if (Object.keys(errors).length > 0) return validationError(errors);

    const email = body.email.trim().toLowerCase();
    if (db.users.some((user) => user.email.toLowerCase() === email)) {
      return conflict('EMAIL_ALREADY_REGISTERED', 'Este e-mail já tem uma conta na Kurio.');
    }

    const username = body.username.trim();
    const user = {
      id: createUserId(),
      username,
      email,
      passwordHash: hashPassword(body.password),
      displayName: username,
      bio: '',
      // Conta nova nasce sem nome ENS e com o apelido de carteira padrao: sao
      // campos do perfil, preenchidos por quem cadastra, nao adivinhados aqui.
      ensName: null,
      walletLabel: DEFAULT_WALLET_LABEL,
      avatarUrl: DEFAULT_AVATAR_URL,
      createdAt: new Date().toISOString(),
    };

    db.users.push(user);
    const session = createSession(db, user.id, scenario.session);
    absorbGuestCart(db, request, user.id);
    commitDatabase();

    return HttpResponse.json<SessionResponse>(toSessionResponse(session, user), { status: 201 });
  }),

  http.post(apiUrl(API_PATTERNS.login), async ({ request }) => {
    const failure = await applyNetworkBehavior();
    if (failure) return failure;

    const body = await readJsonBody<LoginRequest>(request);
    if (!body) return validationError({ form: 'Corpo da requisição inválido.' });

    const db = getDatabase();
    const email = body.email.trim().toLowerCase();
    const user = db.users.find((candidate) => candidate.email.toLowerCase() === email);

    if (!user || !verifyPassword(body.password, user.passwordHash)) {
      return unauthenticated('INVALID_CREDENTIALS', 'E-mail ou senha incorretos.');
    }

    const session = createSession(db, user.id, getActiveScenario().session);
    absorbGuestCart(db, request, user.id);
    commitDatabase();

    return HttpResponse.json<SessionResponse>(toSessionResponse(session, user));
  }),

  http.get(apiUrl(API_PATTERNS.session), async ({ request }) => {
    const failure = await applyNetworkBehavior();
    if (failure) return failure;

    const result = requireSession(request);
    if (!isActiveSession(result)) return result.response;

    return HttpResponse.json<SessionResponse>(toSessionResponse(result.session, result.user));
  }),

  http.post(apiUrl(API_PATTERNS.logout), async ({ request }) => {
    const failure = await applyNetworkBehavior();
    if (failure) return failure;

    const db = getDatabase();
    const resolution = resolveSession(db, request);

    if (resolution.status === 'active') {
      revokeSession(db, resolution.session.token);
      commitDatabase();
    }

    // Logout e idempotente: sem sessao valida o resultado e o mesmo.
    return HttpResponse.json<LogoutResponse>({ loggedOut: true });
  }),
];
