import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';

/**
 * Campo de texto (primitivo shadcn/ui adaptado ao KURIO).
 *
 * Valores do DESIGN_SPEC §3: raio 5, borda 1 `#3F2319`, padding 12/16 e borda
 * `#D28A4C` no foco. O anel de `:focus-visible` do tema continua valendo por
 * cima — a borda accent e do design, o anel e requisito de acessibilidade.
 *
 * O texto digitado usa o tan escuro (`#B39463`), e nao o texto primario: no
 * design quem vem claro e o ROTULO (ver `Label`); o valor respondido fica um
 * tom abaixo.
 *
 * O anel de foco e declarado AQUI, e nao herdado da regra `:focus-visible` do
 * tema: o `outline-none` que apaga o contorno nativo e uma utilidade, e por
 * isso vence a regra da camada base — sem esta linha o campo focado teria
 * apenas a troca de cor da borda, que e um indicador fraco demais para o
 * requisito de foco visivel por teclado.
 *
 * @param props - Props nativas de `input`.
 */
function Input({ className, type = 'text', ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'text-body w-full min-w-0 rounded-control border border-input bg-transparent px-4 py-3 leading-none text-icon-muted outline-none',
        'placeholder:text-tan/60 focus-visible:border-primary',
        'focus-visible:outline-ring focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-60',
        'aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
