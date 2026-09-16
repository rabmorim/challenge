import { RELATED_ITEMS_LIMIT } from '@/features/catalog/constants/catalog';
import { DETAIL_COPY, GALLERY_THUMB_COUNT } from '@/features/nft-detail/constants/detail';

/**
 * Esqueleto do detalhe.
 *
 * Reproduz a **página inteira** — galeria, painel, abas e "mais desta coleção" —
 * e não apenas a primeira dobra. O motivo é medido: com um esqueleto curto, a
 * chegada dos dados empurrava o rodapé para baixo e o CLS da tela ia a 0,23. Com
 * a caixa completa reservada, a troca acontece no lugar.
 */
export function NftDetailSkeleton() {
  return (
    <output
      data-testid="nft-detail-skeleton"
      aria-label={DETAIL_COPY.loading}
      className="flex flex-col gap-16"
    >
      <div className="flex flex-col gap-5 pt-6">
        <div className="skeleton h-4 w-40 rounded-sm" />

        <div className="grid gap-10 lg:grid-cols-2">
          <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-start">
            <div className="flex shrink-0 gap-3 sm:flex-col">
              {Array.from({ length: GALLERY_THUMB_COUNT }, (_unused, index) => (
                <div key={index} className="skeleton rounded-card size-[100px]" />
              ))}
            </div>
            <div className="bg-card aspect-square w-full max-w-[444px] rounded-[6px] p-4">
              <div className="skeleton size-full rounded-[6px]" />
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="skeleton h-8 w-2/3 rounded-sm" />
            <div className="skeleton h-10 w-1/2 rounded-sm" />
            <div className="skeleton h-20 w-full rounded-sm" />
            <div className="skeleton h-8 w-56 rounded-full" />
            <div className="skeleton rounded-control h-11 w-64" />
            <div className="skeleton h-20 w-2/3 rounded-sm" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="skeleton h-8 w-96 rounded-sm" />
        <div className="skeleton h-16 w-full rounded-sm" />
        <div className="skeleton h-16 w-full rounded-sm" />
        <div className="skeleton h-32 w-full rounded-sm" />
      </div>

      <div className="flex flex-col gap-6">
        <div className="skeleton h-8 w-64 rounded-sm" />
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-5">
          {Array.from({ length: RELATED_ITEMS_LIMIT }, (_unused, index) => (
            <div key={index} className="flex flex-col gap-3">
              <div className="bg-card rounded-card p-2">
                <div className="skeleton rounded-card aspect-square w-full" />
              </div>
              <div className="skeleton h-4 w-3/4 rounded-sm" />
              <div className="skeleton h-4 w-1/3 rounded-sm" />
            </div>
          ))}
        </div>
      </div>
    </output>
  );
}
