import { API_PATHS } from '@/constants/api';
import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
  CollectorProfile,
  UpdateAvatarRequest,
  UpdateProfileRequest,
} from '@/features/profile/types/profile';
import { httpClient } from '@/lib/http';

/**
 * Chamadas REST do perfil do colecionador. Todas exigem sessao.
 */

/**
 * Consulta o perfil do usuario autenticado.
 *
 * @param signal - `AbortSignal` do TanStack Query.
 * @returns Perfil com contadores calculados no servidor.
 */
export async function fetchProfile(signal?: AbortSignal): Promise<CollectorProfile> {
  const { data } = await httpClient.get<CollectorProfile>(API_PATHS.profile, signal ? { signal } : undefined);
  return data;
}

/**
 * Atualiza dados do perfil (envio parcial).
 *
 * @param body - Campos a alterar.
 * @returns Perfil atualizado.
 * @throws {NormalizedHttpError} `VALIDATION_ERROR` nos campos invalidos e
 *   `CONFLICT` quando e-mail ou apelido ja pertencem a outra conta.
 */
export async function updateProfile(body: UpdateProfileRequest): Promise<CollectorProfile> {
  const { data } = await httpClient.patch<CollectorProfile>(API_PATHS.profile, body);
  return data;
}

/**
 * Troca o avatar do colecionador.
 *
 * @param body - Imagem em `data:` URL.
 * @returns Perfil atualizado.
 */
export async function updateAvatar(body: UpdateAvatarRequest): Promise<CollectorProfile> {
  const { data } = await httpClient.put<CollectorProfile>(API_PATHS.profileAvatar, body);
  return data;
}

/**
 * Remove o avatar do colecionador.
 *
 * E um verbo proprio (e nao um `PUT` com corpo vazio) porque remover e uma
 * intencao diferente de trocar: sem avatar, a interface cai na inicial do
 * usuario, e nao numa imagem em branco.
 *
 * @returns Perfil atualizado, ja sem o avatar.
 */
export async function removeAvatar(): Promise<CollectorProfile> {
  const { data } = await httpClient.delete<CollectorProfile>(API_PATHS.profileAvatar);
  return data;
}

/**
 * Altera a senha do colecionador.
 *
 * @param body - Senha atual, nova senha e confirmacao.
 * @returns Momento da alteracao.
 * @throws {NormalizedHttpError} `VALIDATION_ERROR` quando a senha atual esta
 *   incorreta ou a nova nao atende as regras.
 */
export async function changePassword(body: ChangePasswordRequest): Promise<ChangePasswordResponse> {
  const { data } = await httpClient.put<ChangePasswordResponse>(API_PATHS.profilePassword, body);
  return data;
}
