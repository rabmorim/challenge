import type { IsoDateTime } from '@/types/api';

/** Contadores exibidos no perfil do colecionador. */
export interface CollectorStats {
  /** NFTs adquiridos em pedidos confirmados. */
  ownedCount: number;
  favoritesCount: number;
  ordersCount: number;
}

/** Perfil completo do colecionador. */
export interface CollectorProfile {
  id: string;
  username: string;
  email: string;
  /** Nome exibido, editavel. */
  displayName: string;
  bio: string;
  /**
   * Nome ENS do colecionador, ou `null` quando ele ainda nao tem um.
   * E o mesmo campo do frame de carteiras, aqui no nivel da conta: no
   * formulario ele e editado em dois controles (ver `lib/ens-name.ts`).
   */
  ensName: string | null;
  /**
   * "Apelido da carteira" do frame do perfil — o rotulo padrao sugerido quando
   * o colecionador cadastra uma carteira nova.
   */
  walletLabel: string;
  /** `''` quando o colecionador removeu o avatar (a interface cai na inicial). */
  avatarUrl: string;
  memberSince: IsoDateTime;
  stats: CollectorStats;
}

/**
 * Corpo da atualizacao de dados do perfil.
 * Campos ausentes ficam inalterados (PATCH parcial).
 */
export interface UpdateProfileRequest {
  username?: string;
  displayName?: string;
  email?: string;
  bio?: string;
  /** `null` remove o nome ENS da conta. */
  ensName?: string | null;
  walletLabel?: string;
}

/** Corpo da troca de avatar — a imagem chega como data URL. */
export interface UpdateAvatarRequest {
  /** Imagem em `data:` URL (base64), como o input de arquivo produz. */
  avatarDataUrl: string;
}

/** Corpo da alteracao de senha. */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirmation: string;
}

/** Resposta da alteracao de senha. */
export interface ChangePasswordResponse {
  /** Momento da alteracao, exibido como confirmacao. */
  changedAt: IsoDateTime;
}
