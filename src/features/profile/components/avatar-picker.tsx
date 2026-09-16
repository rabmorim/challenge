import { useId, useRef } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ACCEPTED_AVATAR_TYPES, PROFILE_COPY } from '@/features/profile/constants/profile';
import type { AvatarPickerProps } from '@/features/profile/types/profile-components';

/**
 * Bloco "Avatar" do frame: miniatura, "Alterar" e "Remover".
 *
 * O input de arquivo fica escondido e o botão "Alterar" o aciona — é o padrão
 * que o frame desenha, e o único que permite um botão com os tokens do tema no
 * lugar do controle nativo do navegador. Escondê-lo com `sr-only` (e não com
 * `display: none`) é o que mantém o campo na ordem de foco e associado ao seu
 * rótulo: quem navega por teclado chega nele e ouve o nome, em vez de encontrar
 * um botão que abre um diálogo sem dono.
 *
 * O `alt` descreve de quem é o retrato; sem avatar, a inicial do usuário entra
 * no lugar (`AvatarFallback`) e a imagem some da árvore — não há alternativa a
 * escrever para uma imagem que não existe.
 *
 * @param props - Controle do avatar, nome exibido e a inicial de reserva.
 */
export function AvatarPicker({ avatar, displayName, initial }: AvatarPickerProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-body text-foreground">{PROFILE_COPY.avatarTitle}</p>

      <div className="flex flex-wrap items-center gap-4">
        <Avatar className="size-11" data-testid="profile-avatar">
          {avatar.previewUrl.length > 0 && (
            <AvatarImage src={avatar.previewUrl} alt={PROFILE_COPY.avatarAlt(displayName)} />
          )}
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>

        <label htmlFor={inputId} className="sr-only">
          {PROFILE_COPY.avatarChange}
        </label>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPTED_AVATAR_TYPES}
          data-testid="avatar-input"
          aria-describedby={avatar.error ? errorId : undefined}
          aria-invalid={avatar.error ? true : undefined}
          className="sr-only"
          onChange={(event) => {
            avatar.select(event.target.files?.[0] ?? null);
            // Zera o input para que escolher o MESMO arquivo de novo (depois de
            // uma falha) volte a disparar `change`.
            event.target.value = '';
          }}
        />

        <Button
          type="button"
          size="sm"
          disabled={avatar.isPending}
          data-testid="avatar-change"
          onClick={() => {
            inputRef.current?.click();
          }}
        >
          {avatar.isPending && !avatar.isRemoving
            ? PROFILE_COPY.avatarSaving
            : PROFILE_COPY.avatarChange}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={avatar.isPending || avatar.previewUrl.length === 0}
          data-testid="avatar-remove"
          onClick={avatar.remove}
        >
          {avatar.isRemoving ? PROFILE_COPY.avatarRemoving : PROFILE_COPY.avatarRemove}
        </Button>
      </div>

      {avatar.error && (
        <p id={errorId} role="alert" className="text-destructive text-body">
          {avatar.error}
        </p>
      )}
    </div>
  );
}
