import { queryOptions } from '@tanstack/react-query';

import { fetchProfile } from '@/features/profile/api/profile-api';
import { PROFILE_QUERY_SEGMENT } from '@/features/profile/constants/profile';
import { queryKeys } from '@/lib/query-keys';

/**
 * Query do perfil do colecionador.
 *
 * Vive no ramo privado com o id do dono na chave: o logout e a troca de conta
 * removem esse ramo inteiro (`clearPrivateCache`), entao o perfil do usuario A
 * nunca casa com a query do usuario B — o isolamento e estrutural, nao uma
 * limpeza que alguem precisa lembrar de fazer.
 *
 * @param userId - Dono do perfil.
 * @returns Opcoes da query do perfil.
 */
export function profileQueryOptions(userId: string) {
  return queryOptions({
    queryKey: queryKeys.private(userId, PROFILE_QUERY_SEGMENT),
    queryFn: ({ signal }) => fetchProfile(signal),
  });
}
