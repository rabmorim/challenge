import { CheckIcon } from 'lucide-react';
import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui';

import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';

/**
 * Menu suspenso (primitivo shadcn/ui adaptado ao KURIO).
 *
 * Usado pelo menu da conta autenticada. O Radix cuida do que a operacao por
 * teclado exige: abrir com Enter/Espaco, navegar com as setas, fechar com
 * `Esc` e devolver o foco ao gatilho.
 */

/** Raiz do menu. */
function DropdownMenu({ ...props }: ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

/** Gatilho do menu. */
function DropdownMenuTrigger({ ...props }: ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

/**
 * Conteudo do menu, em portal.
 *
 * @param props - Props do `Content` do Radix.
 */
function DropdownMenuContent({
  className,
  sideOffset = 8,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          'bg-card text-foreground rounded-panel border-input z-50 min-w-56 overflow-hidden border p-2',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

/**
 * Item acionavel do menu.
 *
 * @param props - Props do `Item` do Radix.
 */
function DropdownMenuItem({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Item>) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      className={cn(
        'text-body rounded-control flex cursor-pointer items-center gap-2 px-3 py-2 outline-none select-none',
        'data-[highlighted]:bg-primary data-[highlighted]:text-primary-foreground',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-60',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Rotulo nao acionavel (cabecalho do menu).
 *
 * @param props - Props do `Label` do Radix.
 */
function DropdownMenuLabel({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Label>) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      className={cn('px-3 py-2', className)}
      {...props}
    />
  );
}

/**
 * Grupo de opcoes mutuamente exclusivas (semantica de `menuitemradio`).
 * Usado pelo "Ordenar por" do catalogo: uma so ordenacao vale por vez, e o
 * Radix marca a selecionada para o leitor de tela.
 *
 * @param props - Props do `RadioGroup` do Radix.
 */
function DropdownMenuRadioGroup({
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return <DropdownMenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />;
}

/**
 * Opcao de um grupo exclusivo.
 *
 * @param props - Props do `RadioItem` do Radix.
 */
function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        'text-body rounded-control relative flex cursor-pointer items-center gap-2 py-2 pr-3 pl-8 outline-none select-none',
        'data-[highlighted]:bg-primary data-[highlighted]:text-primary-foreground',
        'data-[state=checked]:text-primary data-[state=checked]:data-[highlighted]:text-primary-foreground',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-60',
        className,
      )}
      {...props}
    >
      {/* O estado marcado nao pode depender so de cor: o item selecionado
          tambem ganha um sinal grafico. */}
      <span className="absolute left-3 flex size-3 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-3" aria-hidden="true" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}

/** Divisoria entre grupos. */
function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn('bg-input -mx-2 my-2 h-px', className)}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
};
