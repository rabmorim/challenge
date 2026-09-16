import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import {
  MAX_AVATAR_BYTES,
  PROFILE_ERRORS,
  PROFILE_MESSAGES,
} from '@/features/profile/constants/profile';
import {
  useRemoveAvatarMutation,
  useUpdateAvatarMutation,
} from '@/features/profile/hooks/use-profile-mutations';
import type { AvatarControlApi } from '@/features/profile/types/profile-state';
import type { NormalizedHttpError } from '@/types/http';

/** Tipos de imagem que o seletor aceita (espelha `ACCEPTED_AVATAR_TYPES`). */
const ACCEPTED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

/**
 * Bloco de avatar do frame: miniatura, "Alterar" e "Remover".
 *
 * A troca é simulada como o enunciado pede — não há upload real. O arquivo
 * escolhido é lido no navegador e vira uma `data:` URL, que é o que o contrato
 * transporta; o servidor simulado a guarda e devolve o perfil atualizado.
 *
 * **A prévia aparece antes da resposta, mas nada é dado por salvo.** Ela é só o
 * que se está enviando: se a mutation falhar, a prévia é descartada e a
 * miniatura volta à imagem que o servidor ainda tem. É a diferença entre
 * mostrar o que está em voo e afirmar um resultado que não chegou.
 *
 * O `FileReader` é cancelado na desmontagem: sair da tela no meio da leitura
 * deixaria um callback tentando escrever num componente que não existe mais.
 *
 * @param userId - Dono do perfil.
 * @param avatarUrl - Avatar que o servidor tem hoje (`''` quando não há um).
 * @returns Estado e ações do bloco de avatar.
 */
export function useAvatarControl(userId: string, avatarUrl: string): AvatarControlApi {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const readerRef = useRef<FileReader | null>(null);

  const updateMutation = useUpdateAvatarMutation(userId);
  const removeMutation = useRemoveAvatarMutation(userId);

  useEffect(
    () => () => {
      readerRef.current?.abort();
    },
    [],
  );

  /**
   * Trata a falha de uma das mutations do avatar.
   *
   * @param failure - Erro normalizado pelo interceptor do Axios.
   */
  const reportFailure = useCallback((failure: NormalizedHttpError) => {
    // A prévia sai da tela: ela representava um envio que não aconteceu.
    setPreview(null);
    setError(failure.message);
    toast.error(PROFILE_MESSAGES.failed(failure.message));
  }, []);

  const select = useCallback(
    (file: File | null) => {
      if (!file) return;

      if (!ACCEPTED_TYPES.has(file.type)) {
        setError(PROFILE_ERRORS.avatarType);
        return;
      }

      if (file.size > MAX_AVATAR_BYTES) {
        setError(PROFILE_ERRORS.avatarSize);
        return;
      }

      setError(null);
      readerRef.current?.abort();

      const reader = new FileReader();
      readerRef.current = reader;

      reader.addEventListener('load', () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : '';
        if (dataUrl.length === 0) {
          setError(PROFILE_ERRORS.avatarType);
          return;
        }

        setPreview(dataUrl);
        updateMutation.mutate(dataUrl, {
          onSuccess: () => {
            // A partir daqui quem manda é o perfil devolvido pelo servidor.
            setPreview(null);
            toast.success(PROFILE_MESSAGES.avatarSaved);
          },
          onError: reportFailure,
        });
      });

      reader.addEventListener('error', () => {
        setError(PROFILE_ERRORS.avatarType);
      });

      reader.readAsDataURL(file);
    },
    [reportFailure, updateMutation],
  );

  const remove = useCallback(() => {
    setError(null);
    removeMutation.mutate(undefined, {
      onSuccess: () => {
        setPreview(null);
        toast.success(PROFILE_MESSAGES.avatarRemoved);
      },
      onError: reportFailure,
    });
  }, [removeMutation, reportFailure]);

  return {
    previewUrl: preview ?? avatarUrl,
    isPending: updateMutation.isPending || removeMutation.isPending,
    isRemoving: removeMutation.isPending,
    error,
    select,
    remove,
  };
}
