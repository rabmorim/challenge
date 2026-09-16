import { DETAIL_COPY } from '@/features/nft-detail/constants/detail';

/**
 * Esqueleto do detalhe no frame de 414.
 *
 * Reserva as mesmas caixas da tela pronta — bolinhas de 35px, arte de 356px,
 * folha recortada e blocos de texto — para que a chegada dos dados troque o
 * conteúdo no lugar, sem empurrar a página.
 */
export function NftDetailMobileSkeleton() {
  return (
    <output
      data-testid="nft-detail-skeleton"
      aria-label={DETAIL_COPY.loading}
      className="block"
    >
      <section className="surface-gradient px-7 pt-[27px]">
        <div className="flex items-center justify-between">
          <div className="skeleton size-[35px] rounded-full" />
          <div className="skeleton size-[35px] rounded-full" />
        </div>

        <div className="skeleton mt-1 h-[356px] w-full rounded-[24px]" />
      </section>

      <div className="bg-surface relative -mt-[30px] flex flex-col gap-3 rounded-t-[31px] px-6 pt-8 pb-6">
        <div className="flex items-center justify-between gap-3">
          <div className="skeleton h-5 w-48 rounded-sm" />
          <div className="skeleton h-[27px] w-[83px] rounded-full" />
        </div>

        <div className="skeleton h-[72px] w-full rounded-sm" />
        <div className="skeleton h-4 w-20 rounded-sm" />
        <div className="skeleton h-[28px] w-56 rounded-full" />
        <div className="skeleton h-[63px] w-full rounded-sm" />
      </div>
    </output>
  );
}
