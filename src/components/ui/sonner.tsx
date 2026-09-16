import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from 'lucide-react';
import type { CSSProperties } from 'react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

/**
 * Area de toasts do app (primitivo shadcn/ui sobre o `sonner`).
 *
 * Adaptado ao KURIO: o tema e fixo em `dark` (o Figma nao tem frame claro), o
 * que dispensa o `next-themes` usado pelo template original. As cores vem dos
 * tokens do tema, entao o toast acompanha a paleta sem estilo duplicado.
 *
 * `richColors` fica desligado de proposito: cada estado chega com um icone
 * proprio, entao a informacao nunca depende so da cor.
 *
 * @param props - Props do `Toaster` do sonner (posicao, duracao, etc.).
 */
function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" aria-hidden />,
        info: <InfoIcon className="size-4" aria-hidden />,
        warning: <TriangleAlertIcon className="size-4" aria-hidden />,
        error: <OctagonXIcon className="size-4" aria-hidden />,
        loading: <Loader2Icon className="size-4 animate-spin" aria-hidden />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as CSSProperties
      }
      toastOptions={{ classNames: { toast: 'cn-toast' } }}
      {...props}
    />
  );
}

export { Toaster };
