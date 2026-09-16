import { SearchIcon } from 'lucide-react';
import { useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DETAIL_COPY } from '@/features/nft-detail/constants/detail';
import type { NftGalleryProps } from '@/features/nft-detail/types/detail-components';
import { cn } from '@/lib/utils';

/**
 * Galeria do detalhe: coluna de miniaturas e arte principal.
 *
 * As miniaturas são botões com `aria-pressed` — a seleção é anunciada, não
 * apenas desenhada com borda. A lupa abre a arte em tamanho cheio num diálogo
 * do Radix, que já prende e devolve o foco.
 *
 * A moldura tem proporção fixa e as imagens têm dimensões declaradas, então
 * trocar de miniatura não desloca o conteúdo ao lado.
 *
 * @param props - Imagens da galeria, texto alternativo e nome do NFT.
 */
export function NftGallery({ images, alt, name }: NftGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex] ?? images[0] ?? '';

  return (
    <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-start">
      {images.length > 1 && (
        <ul
          aria-label={DETAIL_COPY.galleryLabel}
          className="flex shrink-0 gap-3 overflow-x-auto sm:flex-col sm:overflow-visible"
        >
          {images.map((image, index) => (
            <li key={image}>
              <button
                type="button"
                aria-pressed={index === activeIndex}
                aria-label={DETAIL_COPY.thumbLabel(index + 1, name)}
                onClick={() => {
                  setActiveIndex(index);
                }}
                className={cn(
                  'rounded-card block cursor-pointer overflow-hidden border-2',
                  index === activeIndex ? 'border-primary' : 'border-transparent',
                )}
              >
                <img
                  src={image}
                  alt=""
                  width={100}
                  height={116}
                  loading="lazy"
                  decoding="async"
                  className="size-[100px] object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Moldura do frame: 444×444 de superfície, 16px de respiro e raio de 6px.
          No celular ela encolhe com a coluna, mantendo a proporção. */}
      <div className="bg-card relative aspect-square w-full max-w-[444px] rounded-[6px] p-4">
        <img
          src={active}
          alt={alt}
          width={412}
          height={412}
          fetchPriority="high"
          decoding="async"
          className="rounded-[6px] size-full object-cover"
        />

        <Dialog>
          <DialogTrigger asChild>
            {/* A lupa fica sobre o canto da arte, metade na moldura e metade na
                imagem, como no frame. */}
            <button
              type="button"
              aria-label={DETAIL_COPY.zoomLabel}
              className="bg-border text-foreground absolute top-4 right-4 flex size-8 -translate-y-1/2 translate-x-1/2 cursor-pointer items-center justify-center rounded-full"
            >
              <SearchIcon className="size-5" aria-hidden="true" />
            </button>
          </DialogTrigger>

          <DialogContent className="max-w-[min(90vw,640px)]">
            <DialogTitle className="sr-only">{name}</DialogTitle>
            <DialogDescription className="sr-only">{alt}</DialogDescription>
            <img src={active} alt={alt} className="rounded-card w-full" />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
