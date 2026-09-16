import { useQuery } from '@tanstack/react-query';

import { useSession } from '@/features/auth/hooks/use-session';
import { profileQueryOptions } from '@/features/profile/api/profile-queries';
import { useProfileForm } from '@/features/profile/hooks/use-profile-form';
import type { ProfileScreenState } from '@/features/profile/types/profile-state';
import { isHttpError } from '@/lib/http';

/**
 * Estado da tela "Perfil do colecionador".
 *
 * Reúne a consulta e o formulário num objeto só para que o JSX não precise
 * orquestrar nada: a tela lê `isPending`, `isError` e `form`, e desenha.
 *
 * A rota é privada (`_private`), então o usuário já está resolvido no primeiro
 * render — o guard roda em `beforeLoad`. Ainda assim a query carrega o id do
 * dono na chave: é o que mantém o cache de contas diferentes separado mesmo
 * quando as duas passam pelo mesmo `QueryClient`.
 *
 * @returns Consulta, formulário e a ação de nova tentativa.
 */
export function useProfile(): ProfileScreenState {
  const { user } = useSession();
  const userId = user?.id ?? '';

  const { data, isPending, isError, error, refetch } = useQuery(profileQueryOptions(userId));
  const form = useProfileForm(userId, data);

  return {
    profile: data,
    isPending,
    isError,
    error: isHttpError(error) ? error : null,
    refetch: () => {
      void refetch();
    },
    form,
  };
}
