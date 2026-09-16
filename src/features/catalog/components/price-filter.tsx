import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { RangeSlider } from '@/components/ui/slider';
import { CATALOG_COPY } from '@/features/catalog/constants/catalog-copy';
import { PRICE_SLIDER_STEP } from '@/features/catalog/constants/catalog';
import type { PriceFilterProps } from '@/features/catalog/types/catalog-components';
import { formatEth } from '@/lib/eth';

/**
 * Filtro de faixa de preço.
 *
 * O design tem um botão "Aplicar", e ele não é enfeite: arrastar o slider mexe
 * só no estado local, e a URL (com ela a requisição) muda uma vez, no envio.
 * Sem isso cada pixel arrastado viraria uma consulta.
 *
 * Os limites vêm das facetas do servidor, nunca de constante no cliente — se o
 * catálogo mudar de faixa, o slider acompanha.
 *
 * Medidas do Figma: 12px de recuo nas laterais (a mesma régua das listas de
 * faceta), a faixa escolhida no tom claro do texto (`#F5F1EB`) e o botão com
 * padding 8/12 e raio 6.
 *
 * @param props - Faixa disponível, seleção atual e o que fazer ao aplicar.
 */
export function PriceFilter({ range, selectedMin, selectedMax, onApply, isPending }: PriceFilterProps) {
  const labelId = useId();
  const min = Number(range?.min ?? 0);
  const max = Number(range?.max ?? 0);

  const bounds = `${String(min)}:${String(max)}:${selectedMin ?? ''}:${selectedMax ?? ''}`;
  const [value, setValue] = useState<[number, number]>([
    Number(selectedMin ?? range?.min ?? 0),
    Number(selectedMax ?? range?.max ?? 0),
  ]);
  const [appliedBounds, setAppliedBounds] = useState(bounds);

  // A faixa do catálogo chega com a primeira resposta e muda quando a busca
  // muda; sem ressincronizar, o slider ficaria preso nos limites da consulta
  // anterior. O ajuste acontece durante a renderização (e não em efeito) para
  // que o controle nunca apareça um quadro com os limites velhos.
  if (bounds !== appliedBounds) {
    setAppliedBounds(bounds);
    setValue([Number(selectedMin ?? min), Number(selectedMax ?? max)]);
  }

  if (isPending || !range) {
    return (
      <section className="flex flex-col">
        <h3 className="text-body-lg leading-10 font-bold">{CATALOG_COPY.priceTitle}</h3>
        <div className="flex flex-col gap-4 px-3 py-3" aria-hidden="true">
          <div className="skeleton h-2 w-full rounded-full" />
          <div className="skeleton h-4 w-2/3 rounded-sm" />
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col">
      <h3 className="text-body-lg leading-10 font-bold" id={labelId}>
        {CATALOG_COPY.priceTitle}
      </h3>

      <div className="flex flex-col items-start px-3">
        <RangeSlider
          aria-labelledby={labelId}
          min={min}
          max={max}
          step={PRICE_SLIDER_STEP}
          value={value}
          minStepsBetweenThumbs={1}
          onValueChange={([nextMin, nextMax]) => {
            setValue([nextMin ?? min, nextMax ?? max]);
          }}
          className="my-3"
        />

        <p className="text-foreground text-facet" data-testid="price-range-label">
          Preço: {formatEth(String(value[0]), { withSuffix: false })} -{' '}
          {formatEth(String(value[1]))}
        </p>

        <Button
          className="rounded-button text-body-lg px-3 py-2"
          onClick={() => {
            onApply(String(value[0]), String(value[1]));
          }}
        >
          {CATALOG_COPY.applyPrice}
        </Button>
      </div>
    </section>
  );
}
