import { cn } from '@/lib/utils';

import { BRAND_NAME } from '@/constants/brand';
import type { BrandWordmarkProps } from '@/types/brand';

/**
 * Marca KURIO em texto.
 *
 * E tipografia, nao imagem: o design usa a propria familia monoespacada com
 * espacamento de 10%, entao um SVG so adicionaria peso e um texto alternativo
 * a manter.
 *
 * @param props - Classe extra para ajustar a escala no contexto.
 */
export function BrandWordmark({ className }: BrandWordmarkProps) {
  return (
    <span className={cn('text-label text-foreground tracking-brand', className)}>{BRAND_NAME}</span>
  );
}
