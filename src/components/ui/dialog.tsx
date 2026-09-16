import { cn } from '@/lib/utils';
import { Dialog as DialogPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

/**
 * Dialogo modal (primitivo shadcn/ui adaptado ao KURIO).
 *
 * O Radix cuida do que a acessibilidade exige e o Figma nao desenha: foco
 * preso enquanto aberto, devolucao do foco ao elemento que abriu, fechamento
 * por `Esc` e `aria-modal` com titulo associado. O visual (superficie, raio,
 * faixa accent) fica por conta de quem usa.
 */

/** Raiz do dialogo. */
function Dialog({ ...props }: ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

/** Botao de fechar; usa o gatilho do Radix para devolver o foco corretamente. */
function DialogClose({ ...props }: ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

/**
 * Fundo escurecido atras do dialogo (usado por `DialogContent`).
 *
 * @param props - Props do `Overlay` do Radix.
 */
function DialogOverlay({ className, ...props }: ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'bg-background/80 fixed inset-0 z-50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Conteudo do dialogo, renderizado em portal sobre a pagina.
 *
 * @param props - Props do `Content` do Radix.
 */
function DialogContent({
  className,
  children,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          'bg-card text-foreground fixed z-50 outline-none',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/**
 * Titulo acessivel do dialogo (obrigatorio para o `aria-labelledby`).
 *
 * @param props - Props do `Title` do Radix.
 */
function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-heading', className)}
      {...props}
    />
  );
}

/**
 * Descricao acessivel do dialogo.
 * O Radix avisa no console quando um dialogo nao tem `aria-describedby`; onde
 * o design nao traz texto de apoio, ela vive so para o leitor de tela.
 *
 * @param props - Props do `Description` do Radix.
 */
function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-tan text-body', className)}
      {...props}
    />
  );
}

/**
 * Gatilho que abre o dialogo.
 *
 * @param props - Props do `Trigger` do Radix.
 */
function DialogTrigger({ ...props }: ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

export { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger };
