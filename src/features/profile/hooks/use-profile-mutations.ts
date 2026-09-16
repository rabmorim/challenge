import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { useCallback } from 'react';

import { sessionQueryOptions } from '@/features/auth/api/session-query';
import {
  changePassword,
  removeAvatar,
  updateAvatar,
  updateProfile,
} from '@/features/profile/api/profile-api';
import { profileQueryOptions } from '@/features/profile/api/profile-queries';
import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
  CollectorProfile,
  UpdateProfileRequest,
} from '@/features/profile/types/profile';
import type { NormalizedHttpError } from '@/types/http';

/**
 * Mutations do perfil do colecionador.
 *
 * Nenhuma delas e otimista, por escolha: a interacao otimista obrigatoria do
 * enunciado §4 e a de favoritos, e aqui o custo de errar e outro — mostrar um
 * e-mail novo que o servidor vai recusar por conflito e pior do que esperar a
 * resposta. Elas seguem `loading` / `success` / `error` normais.
 *
 * Depois de cada sucesso o cache e realinhado com a resposta do SERVIDOR
 * (`setQueryData`) e a query e invalidada. Escrever o corpo enviado seria
 * confiar no cliente: o servidor normaliza (apara espacos, baixa o e-mail para
 * minusculas, recalcula os contadores), e o que a tela mostra tem que ser o que
 * ficou gravado.
 */

/**
 * Publica no cache o perfil devolvido pela API.
 *
 * A SESSAO tambem e invalidada porque o header mostra nome, e-mail e avatar da
 * conta: sem isso, salvar o perfil deixaria o menu do header com o nome antigo
 * ate o proximo carregamento.
 *
 * @param userId - Dono do perfil.
 * @returns Funcao que sincroniza cache e sessao.
 */
function useProfileSync(userId: string): (profile: CollectorProfile) => void {
  const queryClient = useQueryClient();

  return useCallback(
    (profile: CollectorProfile) => {
      queryClient.setQueryData(profileQueryOptions(userId).queryKey, profile);
      void queryClient.invalidateQueries({ queryKey: profileQueryOptions(userId).queryKey });
      void queryClient.invalidateQueries({ queryKey: sessionQueryOptions().queryKey });
    },
    [queryClient, userId],
  );
}

/**
 * Atualiza os dados do perfil.
 *
 * @param userId - Dono do perfil.
 * @returns Mutation tipada de atualizacao.
 */
export function useUpdateProfileMutation(
  userId: string,
): UseMutationResult<CollectorProfile, NormalizedHttpError, UpdateProfileRequest> {
  const sync = useProfileSync(userId);

  return useMutation<CollectorProfile, NormalizedHttpError, UpdateProfileRequest>({
    mutationFn: updateProfile,
    onSuccess: sync,
  });
}

/**
 * Troca o avatar do colecionador.
 *
 * @param userId - Dono do perfil.
 * @returns Mutation tipada de troca de avatar.
 */
export function useUpdateAvatarMutation(
  userId: string,
): UseMutationResult<CollectorProfile, NormalizedHttpError, string> {
  const sync = useProfileSync(userId);

  return useMutation<CollectorProfile, NormalizedHttpError, string>({
    mutationFn: (avatarDataUrl) => updateAvatar({ avatarDataUrl }),
    onSuccess: sync,
  });
}

/**
 * Remove o avatar do colecionador.
 *
 * @param userId - Dono do perfil.
 * @returns Mutation tipada de remocao de avatar.
 */
export function useRemoveAvatarMutation(
  userId: string,
): UseMutationResult<CollectorProfile, NormalizedHttpError, void> {
  const sync = useProfileSync(userId);

  return useMutation<CollectorProfile, NormalizedHttpError, void>({
    mutationFn: removeAvatar,
    onSuccess: sync,
  });
}

/**
 * Altera a senha do colecionador.
 *
 * Nao toca no cache: senha nao e dado consultavel, e nenhuma query a guarda —
 * invalidar algo aqui seria trafego sem efeito. O erro da API (`senha atual
 * incorreta`) chega em `fieldErrors` e o formulario o poe no campo certo.
 *
 * @returns Mutation tipada de troca de senha.
 */
export function useChangePasswordMutation(): UseMutationResult<
  ChangePasswordResponse,
  NormalizedHttpError,
  ChangePasswordRequest
> {
  return useMutation<ChangePasswordResponse, NormalizedHttpError, ChangePasswordRequest>({
    mutationFn: changePassword,
  });
}
