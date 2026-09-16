import { Trash2Icon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CART_REMOVE_COPY } from '@/features/cart/constants/cart-copy';
import type { CartRemoveButtonProps } from '@/features/cart/types/cart-components';

/**
 * Lixeira da linha, com confirmação.
 *
 * Remover é destrutivo e o frame não desenha desfazer, então a saída fica atrás
 * de uma pergunta. O diálogo do Radix entrega o que a acessibilidade exige e o
 * Figma não desenha: foco preso enquanto aberto, devolução do foco à própria
 * lixeira ao fechar, `Esc` para sair e título associado ao `aria-modal`.
 *
 * O botão fica desabilitado enquanto a linha tem mutation em voo — dois pedidos
 * de remoção do mesmo item produziriam um `404` no segundo.
 *
 * @param props - Linha, estado da mutation e a confirmação.
 */
export function CartRemoveButton({ item, isBusy, onConfirm }: CartRemoveButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          data-testid="cart-remove"
          aria-label={CART_REMOVE_COPY.trigger(item.name)}
          disabled={isBusy}
          className="text-tan rounded-control flex size-9 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2Icon className="size-4" aria-hidden="true" />
        </button>
      </DialogTrigger>

      <DialogContent
        role="alertdialog"
        className="rounded-panel border-border top-1/2 left-1/2 w-[min(92vw,380px)] -translate-x-1/2 -translate-y-1/2 border p-6"
      >
        <DialogTitle className="text-body-lg font-bold">{CART_REMOVE_COPY.title}</DialogTitle>

        <DialogDescription className="text-tan text-body mt-2">
          {CART_REMOVE_COPY.description(item.name)}
        </DialogDescription>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          <Button
            data-testid="cart-remove-confirm"
            onClick={() => {
              setIsOpen(false);
              onConfirm();
            }}
          >
            {CART_REMOVE_COPY.confirm}
          </Button>

          <DialogClose asChild>
            <Button variant="outline">{CART_REMOVE_COPY.cancel}</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
