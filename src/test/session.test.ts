import { describe, expect, it } from 'vitest';

import { fetchSession, login, logout, signUp } from '@/features/auth/api/auth-api';
import { fetchFavorites } from '@/features/catalog/api/favorites-api';
import { isHttpError } from '@/lib/http';
import { expireAllSessions, selectScenario } from '@/test/mock-control';

/**
 * Sessao e conta: login, consulta, 401 nos protegidos, expiracao e conflito de
 * cadastro. Exercita o api client de verdade — a cadeia Axios -> MSW inteira.
 */
describe('sessao', () => {
  it('autentica com as credenciais semeadas e recupera a sessao', async () => {
    const { user, session } = await login({ email: 'ana@kurio.dev', password: 'kurio1234' });

    expect(user.email).toBe('ana@kurio.dev');
    expect(session.token).toMatch(/^session-/);

    const current = await fetchSession();
    expect(current.user.id).toBe(user.id);
  });

  it('recusa senha incorreta com INVALID_CREDENTIALS', async () => {
    await expect(login({ email: 'ana@kurio.dev', password: 'errada' })).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
      reason: 'INVALID_CREDENTIALS',
      status: 401,
    });
  });

  it('responde 401 em recurso protegido sem sessao', async () => {
    await expect(fetchFavorites()).rejects.toMatchObject({ code: 'UNAUTHENTICATED', status: 401 });
  });

  it('isola os dados privados entre os dois usuarios', async () => {
    await login({ email: 'ana@kurio.dev', password: 'kurio1234' });
    const ana = await fetchFavorites();

    await login({ email: 'bruno@kurio.dev', password: 'kurio4321' });
    const bruno = await fetchFavorites();

    expect(ana.nftIds).toEqual(['emerald-ape-042', 'neon-vessel-552']);
    expect(bruno.nftIds).toEqual(['golden-beat-207']);
    expect(bruno.nftIds).not.toContain('emerald-ape-042');
  });

  it('invalida a sessao no logout', async () => {
    await login({ email: 'ana@kurio.dev', password: 'kurio1234' });
    await logout();

    await expect(fetchSession()).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
  });

  it('sinaliza SESSION_EXPIRED quando a sessao vence durante a navegacao', async () => {
    await login({ email: 'ana@kurio.dev', password: 'kurio1234' });
    await expireAllSessions();

    const error = await fetchFavorites().catch((caught: unknown) => caught);

    expect(isHttpError(error)).toBe(true);
    expect(error).toMatchObject({ code: 'UNAUTHENTICATED', reason: 'SESSION_EXPIRED' });
  });

  it('no cenario session-expired a sessao nasce vencida', async () => {
    await selectScenario('session-expired');
    await login({ email: 'ana@kurio.dev', password: 'kurio1234' });

    await expect(fetchSession()).rejects.toMatchObject({ reason: 'SESSION_EXPIRED' });
  });

  it('valida o cadastro e trata conflito de e-mail', async () => {
    await expect(
      signUp({
        username: 'ab',
        email: 'invalido',
        password: '123',
        passwordConfirmation: '456',
      }),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      status: 422,
      fieldErrors: {
        username: expect.stringContaining('caracteres'),
        email: expect.stringContaining('e-mail'),
        password: expect.stringContaining('caracteres'),
        passwordConfirmation: expect.stringContaining('conferem'),
      },
    });

    await expect(
      signUp({
        username: 'nova.conta',
        email: 'ana@kurio.dev',
        password: 'kurio1234',
        passwordConfirmation: 'kurio1234',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT', reason: 'EMAIL_ALREADY_REGISTERED' });
  });

  it('cria conta nova e abre sessao', async () => {
    const { user } = await signUp({
      username: 'carla.mint',
      email: 'carla@kurio.dev',
      password: 'kurio9876',
      passwordConfirmation: 'kurio9876',
    });

    expect(user.email).toBe('carla@kurio.dev');

    const session = await fetchSession();
    expect(session.user.username).toBe('carla.mint');
  });
});
