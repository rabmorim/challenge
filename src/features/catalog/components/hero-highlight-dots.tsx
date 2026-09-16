import { HOME_COPY } from '@/features/catalog/constants/catalog-copy';
import type { HeroHighlightDotsProps } from '@/features/catalog/types/catalog-components';
import { cn } from '@/lib/utils';

/**
 * Pontos que percorrem os destaques do herói.
 *
 * Não são enfeite: cada ponto troca o NFT exibido. São botões com
 * `aria-current`, operáveis por teclado — um carrossel que só desenha bolinhas
 * seria controle falso. A área de toque de 24px vem do `before`, que cresce
 * fora do fluxo e por isso não alarga o indicador.
 *
 * @param props - Destaques, índice ativo, medida do ponto e o seletor.
 */
export function HeroHighlightDots({
  highlights,
  activeIndex,
  onSelect,
  className,
  dotClassName,
}: HeroHighlightDotsProps) {
  if (highlights.length < 2) return null;

  return (
    <ul aria-label={HOME_COPY.heroCarouselLabel} className={cn('flex items-center', className)}>
      {highlights.map((highlight, index) => (
        <li key={highlight.id} className="flex">
          <button
            type="button"
            aria-label={highlight.name}
            aria-current={index === activeIndex ? 'true' : undefined}
            onClick={() => {
              onSelect(index);
            }}
            className={cn(
              'relative cursor-pointer rounded-full',
              'before:absolute before:-inset-2 before:content-[""]',
              index === activeIndex ? 'bg-primary' : 'bg-primary/40',
              dotClassName,
            )}
          />
        </li>
      ))}
    </ul>
  );
}
