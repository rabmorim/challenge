import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DETAIL_ART_HEIGHT,
  DETAIL_ART_WIDTH,
  DETAIL_COPY,
} from '@/features/nft-detail/constants/detail';
import type { DetailArtProps } from '@/features/nft-detail/types/detail-components';

/**
 * Arte do frame de 414: uma peça só, sangrando na largura da tela.
 *
 * O frame não desenha a coluna de miniaturas nem a lupa do frame de 1440 — no
 * celular a tela abre pela obra. A arte continua abrindo em tamanho cheio, mas
 * o gatilho passa a ser a própria imagem: é o toque que o celular já sugere, e
 * o diálogo do Radix continua prendendo e devolvendo o foco.
 *
 * A altura é fixa e as dimensões vão declaradas no `img`, então a chegada da
 * imagem não desloca a folha de informações logo abaixo.
 *
 * @param props - Imagens da galeria, texto alternativo e nome do NFT.
 */
export function DetailArt({ images, alt, name }: DetailArtProps) {
  const art = images[0] ?? '';

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={DETAIL_COPY.zoomLabel}
          className="block w-full cursor-pointer rounded-[24px]"
        >
          <img
            src={art}
            alt={alt}
            width={DETAIL_ART_WIDTH}
            height={DETAIL_ART_HEIGHT}
            fetchPriority="high"
            decoding="async"
            className="h-[356px] w-full rounded-[24px] object-cover"
          />
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-[min(90vw,640px)]">
        <DialogTitle className="sr-only">{name}</DialogTitle>
        <DialogDescription className="sr-only">{alt}</DialogDescription>
        <img src={art} alt={alt} className="rounded-card w-full" />
      </DialogContent>
    </Dialog>
  );
}
