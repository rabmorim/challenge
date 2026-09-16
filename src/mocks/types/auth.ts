import type { SessionRecord, UserRecord } from '@/mocks/types/db';

/**
 * Resultado da leitura do cabecalho de autorizacao.
 * Distinguir "sem sessao", "token invalido" e "sessao expirada" e o que permite
 * a interface tratar expiracao de forma diferente de acesso anonimo.
 */
export type SessionResolution =
  | { status: 'anonymous' }
  | { status: 'invalid' }
  | { status: 'expired' }
  | { status: 'active'; session: SessionRecord; user: UserRecord };

/**
 * Dono dos dados de uma requisicao.
 *
 * Recursos privados (favoritos, perfil, carteiras, pedidos) exigem `user`.
 * O carrinho aceita `guest`, porque o visitante monta carrinho antes de entrar.
 */
export type OwnerResolution =
  | { status: 'user'; ownerId: string; user: UserRecord; session: SessionRecord }
  | { status: 'guest'; ownerId: string }
  | { status: 'invalid' }
  | { status: 'expired' };
