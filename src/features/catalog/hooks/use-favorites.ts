import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { favoritesQueryOptions } from '@/features/catalog/api/favorites-queries';
import { addFavorite, removeFavorite } from '@/features/catalog/api/favorites-api';
import { FAVORITES_COPY } from '@/features/catalog/constants/favorites';
import type { FavoritesResponse } from '@/features/catalog/types/favorites';
import type { FavoritesApi, FavoriteToggleContext } from '@/features/catalog/types/favorites-state';
import { useAuthPanel } from '@/features/auth/hooks/use-auth-panel';
import { AUTH_TABS } from '@/features/auth/constants/auth';
import { useSession } from '@/features/auth/hooks/use-session';

/**
 * Favoritos do usuário autenticado — leitura e alternância otimista.
 *
 * É a interação otimista obrigatória do enunciado §4: o coração muda na hora,
 * e a falha da mutation devolve **exatamente** o estado anterior (`onError`
 * restaura o instantâneo capturado em `onMutate`). O rollback é do cache
 * inteiro, não de um booleano local, porque o mesmo NFT aparece em vários
 * lugares (grade, destaque, detalhe, "mais desta coleção") e todos precisam
 * voltar juntos.
 *
 * Visitante não tem favorito para alternar: a tentativa abre o painel de
 * autenticação em vez de fingir que funcionou.
 *
 * @returns Conjunto de ids favoritados, estado da consulta e o alternador.
 */
export function useFavorites(): FavoritesApi {
  const { user, isAuthenticated } = useSession();
  const queryClient = useQueryClient();
  const authPanel = useAuthPanel();
  const [lastAnnouncement, setLastAnnouncement] = useState('');

  const options = favoritesQueryOptions(user?.id ?? '');
  const { data, isPending, isError, refetch } = useQuery({
    ...options,
    // Sem sessão não existe recurso para consultar — nem 401 para tratar.
    enabled: isAuthenticated,
  });

  const mutation = useMutation({
    mutationFn: ({ nftId, favorited }: { nftId: string; favorited: boolean }) =>
      favorited ? removeFavorite(nftId) : addFavorite(nftId),

    onMutate: async ({ nftId, favorited }): Promise<FavoriteToggleContext> => {
      // Cancela consultas em voo: uma resposta antiga chegando depois
      // reescreveria o cache por cima do valor otimista.
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      const previous = queryClient.getQueryData<FavoritesResponse>(options.queryKey);

      queryClient.setQueryData<FavoritesResponse>(options.queryKey, (current) => {
        const base = current ?? { nftIds: [], items: [] };
        return {
          ...base,
          nftIds: favorited
            ? base.nftIds.filter((id) => id !== nftId)
            : [...base.nftIds, nftId],
          // A lista de itens só o servidor sabe montar; na remoção dá para
          // antecipar, na inclusão a resposta traz o item na invalidação.
          items: favorited ? base.items.filter((item) => item.id !== nftId) : base.items,
        };
      });

      setLastAnnouncement(favorited ? FAVORITES_COPY.removed : FAVORITES_COPY.added);
      return { previous: previous ?? null };
    },

    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(options.queryKey, context.previous);
      else queryClient.removeQueries({ queryKey: options.queryKey });

      setLastAnnouncement(FAVORITES_COPY.failed);
      toast.error(FAVORITES_COPY.failed);
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: options.queryKey });
    },
  });

  const favoriteIds = useMemo(() => new Set(data?.nftIds ?? []), [data]);

  const toggleFavorite = useCallback(
    (nftId: string) => {
      if (!isAuthenticated) {
        // Visitante não tem favorito para alternar: em vez de fingir sucesso,
        // o caminho é o painel de autenticação (enunciado §3).
        toast.info(FAVORITES_COPY.requiresSession);
        authPanel.open(AUTH_TABS.signIn);
        return;
      }
      mutation.mutate({ nftId, favorited: favoriteIds.has(nftId) });
    },
    [authPanel, favoriteIds, isAuthenticated, mutation],
  );

  return {
    favoriteIds,
    items: data?.items ?? [],
    isPending: isAuthenticated && isPending,
    isError,
    isAuthenticated,
    pendingNftId: mutation.isPending ? (mutation.variables?.nftId ?? null) : null,
    announcement: lastAnnouncement,
    toggleFavorite,
    refetch: () => {
      void refetch();
    },
  };
}
