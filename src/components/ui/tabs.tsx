import { cn } from '@/lib/utils';
import { Tabs as TabsPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

import { FOCUS_RING_CLASS } from '@/constants/a11y';

/**
 * Abas (primitivo shadcn/ui adaptado ao KURIO).
 *
 * O Radix entrega a semantica que o desenho sozinho nao tem: `tablist`,
 * navegacao por setas e associacao entre aba e painel. O estilo do KURIO fica
 * nos componentes que consomem — aqui ficam so os padroes comuns.
 */

/** Raiz das abas. */
function Tabs({ className, ...props }: ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root data-slot="tabs" className={cn('flex flex-col', className)} {...props} />
  );
}

/** Lista de gatilhos. */
function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn('inline-flex items-center', className)}
      {...props}
    />
  );
}

/**
 * Gatilho de uma aba.
 *
 * O anel entra junto do `outline-none` porque a aba INATIVA, alcançada pelas
 * setas, não tem estilo de seleção — sem indicação de foco a navegação por
 * teclado ficaria cega entre uma aba e outra.
 */
function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn('cursor-pointer outline-none disabled:opacity-60', FOCUS_RING_CLASS, className)}
      {...props}
    />
  );
}

/**
 * Painel de uma aba.
 *
 * O Radix dá `tabindex=0` ao painel, então ele é uma parada de `Tab` de
 * verdade e precisa do anel — caso contrário o foco desapareceria ao sair dos
 * gatilhos.
 */
function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('outline-none', FOCUS_RING_CLASS, className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
