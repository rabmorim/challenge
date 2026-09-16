import { APP_ICONS } from '@/constants/app-icons';
import type { AppIconProps } from '@/types/components';
import { cn } from '@/lib/utils';

/**
 * Ícone exportado do Figma, pintado com a cor do contexto.
 *
 * O arquivo entra como máscara CSS, não como `img`, para que o glifo herde o
 * `currentColor` (ver `APP_ICONS`). É sempre decorativo — quem nomeia a ação é
 * o rótulo acessível do controle que o envolve.
 *
 * O tamanho padrão é o do arquivo exportado; `className` pode trocá-lo quando o
 * lugar pedir outra medida.
 *
 * @param props - Glifo a desenhar e classes extras do elemento.
 */
export function AppIcon({ id, className }: AppIconProps) {
  const icon = APP_ICONS[id];

  return (
    <span
      aria-hidden="true"
      style={{
        maskImage: `url(${icon.src})`,
        WebkitMaskImage: `url(${icon.src})`,
        width: `${String(icon.size)}px`,
        height: `${String(icon.size)}px`,
      }}
      className={cn('inline-block shrink-0 bg-current bg-no-repeat mask-contain mask-center mask-no-repeat', className)}
    />
  );
}
