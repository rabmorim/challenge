import { cn } from '@/lib/utils';
import { Label as LabelPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

/**
 * Rotulo de campo (primitivo shadcn/ui adaptado ao KURIO).
 * Clicar no rotulo foca o campo associado — por isso o primitivo do Radix, e
 * nao um `span`.
 *
 * Cor do texto primario (`#F5F1EB`): no design o rotulo e o texto claro e o
 * VALOR digitado e que vem no tan escuro (`#B39463`, ver `Input`) — o contrario
 * do que a intuicao sugere, e o que separa o que o formulario pede do que o
 * usuario respondeu.
 *
 * @param props - Props do `Label` do Radix.
 */
function Label({ className, ...props }: ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn('text-body text-foreground leading-none select-none', className)}
      {...props}
    />
  );
}

export { Label };
