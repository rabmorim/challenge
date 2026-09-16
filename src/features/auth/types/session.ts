import type { AuthenticatedUser } from '@/features/auth/types/user';
import type { IsoDateTime } from '@/types/api';

/** Sessao emitida pela API simulada. O token viaja no header `Authorization`. */
export interface Session {
  /** Token opaco da sessao. */
  token: string;
  userId: string;
  issuedAt: IsoDateTime;
  /** Momento em que a sessao expira — a interface trata a expiracao ativa. */
  expiresAt: IsoDateTime;
}

/** Resposta de login, cadastro e consulta de sessao. */
export interface SessionResponse {
  session: Session;
  user: AuthenticatedUser;
}

/** Corpo do login. */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Corpo do cadastro — a confirmacao de senha tambem e validada no servidor. */
export interface SignUpRequest {
  username: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

/** Resposta do logout: confirma o encerramento da sessao no servidor. */
export interface LogoutResponse {
  /** Sempre `true` quando a sessao foi encerrada (ou ja nao existia). */
  loggedOut: true;
}
