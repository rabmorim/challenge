import { Slider as SliderPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/**
 * Slider de faixa (primitivo shadcn/ui adaptado ao KURIO).
 *
 * São dois polegares fixos — mínimo e máximo — porque o único uso do design é a
 * faixa de preço da sidebar. Deixá-los explícitos, em vez de mapear o array de
 * valores, dá a cada um identidade estável e evita remontagem durante o arrasto.
 *
 * O Radix entrega o que o desenho sozinho não tem: papéis corretos, operação
 * por teclado (setas, Home/End) e `aria-valuetext` em cada polegar.
 *
 * @param props - Props do primitivo do Radix (valor, mínimo, máximo, passo).
 */
function RangeSlider({ className, ...props }: ComponentProps<typeof SliderPrimitive.Root>) {
  const thumbClassName = 'bg-primary block size-3.5 rounded-full outline-none disabled:opacity-60';

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn('relative flex w-full touch-none items-center select-none', className)}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="bg-input relative h-0.5 w-full grow rounded-full"
      >
        <SliderPrimitive.Range data-slot="slider-range" className="bg-primary absolute h-full" />
      </SliderPrimitive.Track>

      <SliderPrimitive.Thumb data-slot="slider-thumb" className={thumbClassName} />
      <SliderPrimitive.Thumb data-slot="slider-thumb" className={thumbClassName} />
    </SliderPrimitive.Root>
  );
}

export { RangeSlider };
