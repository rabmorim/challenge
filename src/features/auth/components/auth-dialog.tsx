import { XIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { AuthPanel } from '@/features/auth/components/auth-panel';
import { AUTH_COPY, AUTH_SUBTITLE_ID } from '@/features/auth/constants/auth';
import { useAuthPanel } from '@/features/auth/hooks/use-auth-panel';
import { useReturnFocus } from '@/features/auth/hooks/use-return-focus';
import { cn } from '@/lib/utils';

/**
 * Painel de autenticacao: modal no desktop, tela cheia no mobile.
 *
 * Abre e fecha pela URL (`?auth=`), entao sobrevive ao refresh e funciona como
 * destino de redirecionamento do guard. A moldura e um dialogo do Radix nos
 * dois tamanhos — mesmo em tela cheia queremos foco preso, `Esc` para fechar e
 * devolucao do foco ao elemento que abriu, que o frame do Figma nao descreve.
 *
 * O titulo fica visivel apenas para tecnologia assistiva: quem enxerga le as
 * abas, que sao o cabecalho do design.
 */
export function AuthDialog() {
  const panel = useAuthPanel();
  useReturnFocus(panel.isOpen);

  return (
    <Dialog
      open={panel.isOpen}
      onOpenChange={(open) => {
        if (!open) panel.close();
      }}
    >
      <DialogContent
        aria-describedby={AUTH_SUBTITLE_ID}
        className={cn(
          // Goteira lateral publicada como variavel: a divisoria de "Ou continue
          // com" precisa anula-la para sangrar ate as bordas do painel.
          '[--auth-gutter:1.75rem] sm:[--auth-gutter:5rem]',
          'inset-0 h-dvh w-full overflow-y-auto px-(--auth-gutter) py-12',
          'sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[92dvh] sm:w-[500px]',
          'sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-panel sm:py-10',
          'sm:border-b-4 sm:border-b-primary',
        )}
      >
        <DialogTitle className="sr-only">{AUTH_COPY.dialogTitle}</DialogTitle>

        <DialogClose asChild>
          <Button variant="ghost" size="icon" className="text-primary absolute top-4 right-4">
            <XIcon className="size-5" aria-hidden="true" />
            <span className="sr-only">{AUTH_COPY.close}</span>
          </Button>
        </DialogClose>

        <AuthPanel
          tab={panel.tab}
          onTabChange={panel.selectTab}
          onAuthenticated={panel.finish}
        />
      </DialogContent>
    </Dialog>
  );
}
