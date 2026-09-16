import { cn } from '@/lib/utils';
import { Avatar as AvatarPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

/**
 * Avatar (primitivo shadcn/ui adaptado ao KURIO).
 * O `Fallback` do Radix cobre o caso de a arte do perfil nao carregar — o
 * layout mantem a mesma dimensao, sem deslocamento.
 */

/** Raiz do avatar. */
function Avatar({ className, ...props }: ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn('relative flex size-9 shrink-0 overflow-hidden rounded-full', className)}
      {...props}
    />
  );
}

/** Imagem do avatar. */
function AvatarImage({ className, ...props }: ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aspect-square size-full object-cover', className)}
      {...props}
    />
  );
}

/** Conteudo exibido enquanto a imagem nao carrega (ou quando falha). */
function AvatarFallback({ className, ...props }: ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'bg-primary text-primary-foreground text-body flex size-full items-center justify-center font-bold uppercase',
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
