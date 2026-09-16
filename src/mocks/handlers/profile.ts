import { HttpResponse, http, type HttpHandler } from 'msw';

import { API_PATTERNS } from '@/constants/api';
import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
  CollectorProfile,
  UpdateAvatarRequest,
  UpdateProfileRequest,
} from '@/features/profile/types/profile';
import {
  EMPTY_AVATAR_URL,
  MIN_PASSWORD_LENGTH,
  MIN_USERNAME_LENGTH,
} from '@/mocks/constants';
import { hashPassword, verifyPassword } from '@/mocks/db/password';
import { commitDatabase } from '@/mocks/db/store';
import { apiUrl, isActiveSession, readJsonBody, requireSession } from '@/mocks/handlers/shared';
import { conflict, validationError } from '@/mocks/lib/responses';
import { applyNetworkBehavior } from '@/mocks/scenarios/network';
import type { MockDatabase, UserRecord } from '@/mocks/types/db';

/**
 * Perfil do colecionador: consulta, atualizacao de dados, avatar e senha.
 * Todos exigem sessao e enxergam apenas o proprio usuario.
 */

/** Prefixo aceito no avatar enviado pelo formulario. */
const AVATAR_DATA_URL_PREFIX = 'data:image/';

/** Formato aceito para o nome ENS (`rotulo.tld`, minusculo). */
const ENS_PATTERN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;

/** Tamanho minimo do apelido da carteira. */
const MIN_WALLET_LABEL_LENGTH = 3;

/**
 * Monta o perfil publicado, com os contadores calculados no servidor.
 *
 * @param db - Estado do servidor simulado.
 * @param user - Usuario autenticado.
 * @returns Perfil completo.
 */
function toCollectorProfile(db: MockDatabase, user: UserRecord): CollectorProfile {
  const orders = db.orders.filter((order) => order.userId === user.id);

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    bio: user.bio,
    ensName: user.ensName,
    walletLabel: user.walletLabel,
    avatarUrl: user.avatarUrl,
    memberSince: user.createdAt,
    stats: {
      // Somente pedidos confirmados contam como itens adquiridos.
      ownedCount: orders
        .filter((order) => order.status === 'confirmed')
        .reduce((total, order) => total + order.items.reduce((sum, item) => sum + item.quantity, 0), 0),
      favoritesCount: db.favorites.filter((favorite) => favorite.userId === user.id).length,
      ordersCount: orders.length,
    },
  };
}

/** Handlers do perfil. */
export const profileHandlers: HttpHandler[] = [
  http.get(apiUrl(API_PATTERNS.profile), async ({ request }) => {
    const failure = await applyNetworkBehavior();
    if (failure) return failure;

    const result = requireSession(request);
    if (!isActiveSession(result)) return result.response;

    return HttpResponse.json<CollectorProfile>(toCollectorProfile(result.db, result.user));
  }),

  http.patch(apiUrl(API_PATTERNS.profile), async ({ request }) => {
    const failure = await applyNetworkBehavior();
    if (failure) return failure;

    const result = requireSession(request);
    if (!isActiveSession(result)) return result.response;

    const body = await readJsonBody<UpdateProfileRequest>(request);
    if (!body) return validationError({ form: 'Corpo da requisicao invalido.' });

    const { db, user } = result;
    const errors: Record<string, string> = {};

    if (body.username !== undefined && body.username.trim().length < MIN_USERNAME_LENGTH) {
      errors.username = `Use ao menos ${String(MIN_USERNAME_LENGTH)} caracteres.`;
    }

    if (body.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      errors.email = 'Informe um e-mail valido.';
    }

    if (body.displayName !== undefined && body.displayName.trim().length < MIN_USERNAME_LENGTH) {
      errors.displayName = `Use ao menos ${String(MIN_USERNAME_LENGTH)} caracteres.`;
    }

    if (body.walletLabel !== undefined && body.walletLabel.trim().length < MIN_WALLET_LABEL_LENGTH) {
      errors.walletLabel = `Use ao menos ${String(MIN_WALLET_LABEL_LENGTH)} caracteres no apelido.`;
    }

    if (
      body.ensName !== undefined &&
      body.ensName !== null &&
      !ENS_PATTERN.test(body.ensName.trim().toLowerCase())
    ) {
      errors.ensName = 'Nome ENS invalido: use o formato nome.eth.';
    }

    if (Object.keys(errors).length > 0) return validationError(errors);

    if (body.email) {
      const email = body.email.trim().toLowerCase();
      const taken = db.users.some(
        (candidate) => candidate.id !== user.id && candidate.email.toLowerCase() === email,
      );
      if (taken) return conflict('EMAIL_ALREADY_REGISTERED', 'Este e-mail ja esta em uso.');
      user.email = email;
    }

    if (body.username) {
      const username = body.username.trim();
      const taken = db.users.some(
        (candidate) =>
          candidate.id !== user.id && candidate.username.toLowerCase() === username.toLowerCase(),
      );
      if (taken) return conflict('USERNAME_ALREADY_TAKEN', 'Este nome de usuário já está em uso.');
      user.username = username;
    }

    if (body.displayName !== undefined) user.displayName = body.displayName.trim();
    if (body.bio !== undefined) user.bio = body.bio;
    if (body.walletLabel !== undefined) user.walletLabel = body.walletLabel.trim();
    // `null` explicito remove o ENS; ausente deixa como esta (PATCH parcial).
    if (body.ensName !== undefined) user.ensName = body.ensName?.trim().toLowerCase() || null;

    commitDatabase();
    return HttpResponse.json<CollectorProfile>(toCollectorProfile(db, user));
  }),

  http.put(apiUrl(API_PATTERNS.profileAvatar), async ({ request }) => {
    const failure = await applyNetworkBehavior();
    if (failure) return failure;

    const result = requireSession(request);
    if (!isActiveSession(result)) return result.response;

    const body = await readJsonBody<UpdateAvatarRequest>(request);
    if (!body?.avatarDataUrl.startsWith(AVATAR_DATA_URL_PREFIX)) {
      return validationError({ avatarDataUrl: 'Envie uma imagem valida.' });
    }

    result.user.avatarUrl = body.avatarDataUrl;
    commitDatabase();

    return HttpResponse.json<CollectorProfile>(toCollectorProfile(result.db, result.user));
  }),

  http.delete(apiUrl(API_PATTERNS.profileAvatar), async ({ request }) => {
    const failure = await applyNetworkBehavior();
    if (failure) return failure;

    const result = requireSession(request);
    if (!isActiveSession(result)) return result.response;

    // Remover deixa a conta SEM avatar (nao devolve o retrato generico): a
    // interface cai na inicial do usuario, que e o que o frame desenha depois
    // de "Remover".
    result.user.avatarUrl = EMPTY_AVATAR_URL;
    commitDatabase();

    return HttpResponse.json<CollectorProfile>(toCollectorProfile(result.db, result.user));
  }),

  http.put(apiUrl(API_PATTERNS.profilePassword), async ({ request }) => {
    const failure = await applyNetworkBehavior();
    if (failure) return failure;

    const result = requireSession(request);
    if (!isActiveSession(result)) return result.response;

    const body = await readJsonBody<ChangePasswordRequest>(request);
    if (!body) return validationError({ form: 'Corpo da requisicao invalido.' });

    const errors: Record<string, string> = {};

    if (!verifyPassword(body.currentPassword, result.user.passwordHash)) {
      errors.currentPassword = 'Senha atual incorreta.';
    }

    if (body.newPassword.length < MIN_PASSWORD_LENGTH) {
      errors.newPassword = `A senha precisa de ao menos ${String(MIN_PASSWORD_LENGTH)} caracteres.`;
    }

    if (body.newPassword !== body.newPasswordConfirmation) {
      errors.newPasswordConfirmation = 'As senhas nao conferem.';
    }

    if (Object.keys(errors).length > 0) return validationError(errors);

    result.user.passwordHash = hashPassword(body.newPassword);
    commitDatabase();

    return HttpResponse.json<ChangePasswordResponse>({ changedAt: new Date().toISOString() });
  }),
];
