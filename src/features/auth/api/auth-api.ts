import { API_PATHS } from '@/constants/api';
import type {
  LoginRequest,
  LogoutResponse,
  SessionResponse,
  SignUpRequest,
} from '@/features/auth/types/session';
import { httpClient } from '@/lib/http';
import { clearGuestId, clearSessionToken, setSessionToken } from '@/lib/request-identity';

/**
 * Chamadas REST de sessao e conta.
 *
 * Nenhum dado ficticio aqui: so transporte. O token e gravado/descartado nestas
 * funcoes de proposito — assim qualquer caminho que autentique ou saia da conta
 * mantem o interceptor do Axios em sincronia com a sessao real.
 */

/**
 * Cria uma conta e abre a sessao.
 *
 * @param body - Nome de usuario, e-mail, senha e confirmacao.
 * @returns Sessao e usuario recem-criados.
 * @throws {NormalizedHttpError} `VALIDATION_ERROR` nos campos invalidos e
 *   `CONFLICT` quando o e-mail (ou o apelido) ja existe.
 */
export async function signUp(body: SignUpRequest): Promise<SessionResponse> {
  const { data } = await httpClient.post<SessionResponse>(API_PATHS.signUp, body);
  setSessionToken(data.session.token);
  // O carrinho do visitante ja foi absorvido pela conta no servidor.
  clearGuestId();
  return data;
}

/**
 * Autentica o colecionador.
 *
 * @param body - E-mail e senha.
 * @returns Sessao e usuario autenticados.
 * @throws {NormalizedHttpError} `UNAUTHENTICATED` com `INVALID_CREDENTIALS`
 *   quando e-mail ou senha nao conferem.
 */
export async function login(body: LoginRequest): Promise<SessionResponse> {
  const { data } = await httpClient.post<SessionResponse>(API_PATHS.login, body);
  setSessionToken(data.session.token);
  clearGuestId();
  return data;
}

/**
 * Consulta a sessao corrente (usada para recuperar a sessao apos refresh).
 *
 * @param signal - `AbortSignal` do TanStack Query.
 * @returns Sessao e usuario ativos.
 * @throws {NormalizedHttpError} `UNAUTHENTICATED` (com `SESSION_EXPIRED` quando
 *   a sessao venceu durante a navegacao).
 */
export async function fetchSession(signal?: AbortSignal): Promise<SessionResponse> {
  const { data } = await httpClient.get<SessionResponse>(API_PATHS.session, signal ? { signal } : undefined);
  return data;
}

/**
 * Encerra a sessao no servidor e descarta o token local.
 *
 * @returns Confirmacao do encerramento.
 */
export async function logout(): Promise<LogoutResponse> {
  try {
    const { data } = await httpClient.post<LogoutResponse>(API_PATHS.logout, {});
    return data;
  } finally {
    // O token sai mesmo se a chamada falhar: a sessao local nao pode sobreviver
    // a uma tentativa de logout.
    clearSessionToken();
  }
}
