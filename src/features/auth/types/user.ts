import type { IsoDateTime } from '@/types/api';

/**
 * Usuario autenticado, na forma minima que a interface precisa para
 * identificar a sessao (o perfil completo vive em `features/profile`).
 */
export interface AuthenticatedUser {
  id: string;
  /** Apelido publico, exibido no header e no perfil. */
  username: string;
  email: string;
  /** Caminho da imagem de avatar servida localmente. */
  avatarUrl: string;
  createdAt: IsoDateTime;
}
