import { TOUCH_TARGET_EXPANSION_CLASS } from '@/constants/a11y';
import { CAROUSEL_COPY } from '@/constants/carousel';
import type { CarouselDotsProps } from '@/types/components';
import { cn } from '@/lib/utils';

/**
 * Fila de bolinhas que troca a página de um carrossel de NFTs.
 *
 * São botões de verdade: alcançáveis por Tab, com rótulo que diz a posição e
 * `aria-current` na página aberta — o estado não depende só do preenchimento
 * do círculo. Com uma página só não há o que escolher e nada é desenhado.
 *
 * O ponto continua com os 10px do frame; a área de toque cresce para 24px por
 * pseudo-elemento, que fica FORA do fluxo e por isso não alarga o indicador nem
 * muda o espaçamento da fila (WCAG 2.5.8). O passo horizontal permanece o do
 * Figma — o desvio está registrado no ARCHITECTURE.
 *
 * Vive fora das features porque o frame desenha o mesmo controle em "Mais desta
 * coleção" (detalhe) e em "Colecionadores também viram" (carrinho).
 *
 * @param props - Total de páginas, página corrente e o seletor.
 */
export function CarouselDots({ page, pageCount, onSelect }: CarouselDotsProps) {
  if (pageCount < 2) return null;

  return (
    <ul data-testid="carousel-dots" className="flex items-center justify-center gap-2">
      {Array.from({ length: pageCount }, (_unused, index) => (
        <li key={index}>
          <button
            type="button"
            aria-current={index === page ? 'true' : undefined}
            aria-label={CAROUSEL_COPY.page(index + 1, pageCount)}
            onClick={() => {
              onSelect(index);
            }}
            className={cn(
              'relative block size-2.5 cursor-pointer rounded-full',
              TOUCH_TARGET_EXPANSION_CLASS,
              index === page ? 'bg-primary' : 'bg-tan/60',
            )}
          />
        </li>
      ))}
    </ul>
  );
}
