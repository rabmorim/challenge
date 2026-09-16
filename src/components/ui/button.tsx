import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';
import { Slot } from 'radix-ui';

import { FOCUS_RING_CLASS } from '@/constants/a11y';

/**
 * Variantes do botao (primitivo shadcn/ui adaptado ao KURIO).
 *
 * O Figma nao desenha hover — o accent e chapado —, mas `:focus-visible` e
 * `disabled` sao obrigatorios (a11y e submit em andamento) e por isso existem
 * aqui seguindo o mesmo padrao visual: anel no accent e contraste reduzido.
 *
 * O anel e declarado AQUI, junto do `outline-none`, e nao herdado da regra
 * `:focus-visible` do tema: `outline-none` e uma utilidade e vence a camada
 * base, entao sem esta linha TODO botao do app ficaria sem indicacao de foco —
 * inclusive os `asChild`, que aplicam estas mesmas classes a um link.
 */
const buttonVariants = cva(
  `inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-control leading-none whitespace-nowrap outline-none disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:shrink-0 ${FOCUS_RING_CLASS}`,
  {
    variants: {
      variant: {
        /** CTA do design: fundo accent, texto escuro. */
        primary: 'bg-primary text-primary-foreground text-body-lg font-bold',
        /** Botao de borda (sociais, acoes secundarias): rotulo no tan do design. */
        outline: 'border border-input bg-transparent text-tan text-body',
        /** Acao sem moldura (icones do header, fechar dialogo). */
        ghost: 'bg-transparent text-foreground',
        /** Link de texto no accent claro (ex.: "Esqueceu a senha?"). */
        link: 'text-link text-body underline-offset-4 hover:underline',
      },
      size: {
        /** Altura dos formularios do design (padding 14/16). */
        default: 'px-4 py-3.5',
        /** Controles compactos do header. */
        sm: 'px-4 py-2.5 text-body',
        /** Apenas icone, area de toque preservada. */
        icon: 'size-9 p-0',
        /** Sem dimensao propria — para links inline. */
        inline: 'p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

/**
 * Botao do app.
 *
 * @param props - Props nativas de `button`, variante, tamanho e `asChild`.
 */
function Button({
  className,
  variant,
  size,
  asChild = false,
  type = 'button',
  ...props
}: ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Component = asChild ? Slot.Root : 'button';

  return (
    <Component
      data-slot="button"
      // `type` explicito: dentro de um formulario o padrao do HTML e `submit`,
      // o que faria qualquer botao auxiliar enviar o formulario sem querer.
      {...(asChild ? {} : { type })}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button };
