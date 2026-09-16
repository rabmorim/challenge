import { cn } from '@/lib/utils';
import { Tabs as TabsPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

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

/** Gatilho de uma aba. */
function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn('cursor-pointer outline-none disabled:opacity-60', className)}
      {...props}
    />
  );
}

/** Painel de uma aba. */
function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('outline-none', className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
