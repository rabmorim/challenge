import { Link } from '@tanstack/react-router';

import { nftDetailPath } from '@/constants/routes';
import { DETAIL_COPY } from '@/features/nft-detail/constants/detail';
import type { EditionSelectorProps } from '@/features/nft-detail/types/detail-components';
import { cn } from '@/lib/utils';

/**
 * Chips de edição do detalhe.
 *
 * No Figma os chips aparecem como `1/1`, `1/10`, `1/50` e `ABERTA`. Aqui eles
 * são reais: cada chip é uma **edição existente da mesma coleção** (o tamanho
 * da tiragem que a API informa) e selecioná-lo navega para aquele item. Uma
 * edição sem unidades fica desabilitada e diz que está esgotada — é o caso
 * "edição indisponível" do enunciado §3, não um estado desenhado.
 *
 * O último chip é o estado da edição corrente (aberta/esgotada), como no frame.
 *
 * @param props - Edições irmãs, disponibilidade atual e o estado da consulta.
 */
export function EditionSelector({ options, available, isPending }: EditionSelectorProps) {
  if (isPending) {
    return <div className="skeleton h-8 w-56 rounded-full" aria-hidden="true" />;
  }

  // Elipse do frame: 66×28 com borda de 1px. O chip de estado acompanha a
  // altura, mas cresce com a palavra ("ABERTA"/"ESGOTADA") em vez de cortá-la.
  const chipClassName =
    'text-body flex h-[28px] w-[46px] items-center justify-center rounded-full border';

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-body-lg font-bold">{DETAIL_COPY.editionTitle}</h2>

      <ul aria-label={DETAIL_COPY.editionLabel} className="flex flex-wrap items-center gap-2">
        {options.map((option) => {
          const label = `1/${String(option.total)}`;
          const isSoldOut = option.available === 0;

          return (
            <li key={option.nftId}>
              {option.isCurrent ? (
                <span
                  aria-current="true"
                  className={cn(chipClassName, 'border-primary text-primary')}
                >
                  {label}
                  <span className="sr-only"> (edição atual)</span>
                </span>
              ) : isSoldOut ? (
                <span
                  aria-disabled="true"
                  title={DETAIL_COPY.editionSoldOut}
                  className={cn(chipClassName, 'border-input text-tan line-through opacity-60')}
                >
                  {label}
                  <span className="sr-only"> — {DETAIL_COPY.editionSoldOut}</span>
                </span>
              ) : (
                <Link
                  to={nftDetailPath(option.slug)}
                  aria-label={DETAIL_COPY.editionChipLabel(option.total, option.name)}
                  className={cn(chipClassName, 'border-input text-tan')}
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}

        <li>
          <span
            data-testid="edition-status"
            className={cn(
              chipClassName,
              'w-auto px-3',
              available > 0 ? 'border-input text-tan' : 'border-destructive/60 text-destructive',
            )}
          >
            {available > 0 ? DETAIL_COPY.editionOpen : DETAIL_COPY.editionSoldOut}
          </span>
        </li>
      </ul>
    </div>
  );
}
