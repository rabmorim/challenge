import type { FacetFilterProps } from '@/features/catalog/types/catalog-components';
import { cn } from '@/lib/utils';

/**
 * Grupo de filtros por faceta (coleções, redes).
 *
 * Cada opção é um `button` com `aria-pressed` — e não uma `div` clicável —
 * porque precisa ser alcançável por Tab, acionável por Enter/Espaço e ter o
 * estado anunciado. A opção marcada muda de peso além de mudar de cor, para
 * que a marcação não dependa só do accent.
 *
 * A régua vem do DESIGN_SPEC §4: a lista interna tem 12px de recuo nas
 * laterais e cada linha ocupa 40px (15px de texto em linha de 40) — nove
 * coleções fecham exatamente os 360px do frame.
 *
 * As contagens vêm das facetas da resposta: são calculadas antes dos filtros de
 * coleção/rede, então marcar um filtro não zera as contagens dos outros — que é
 * o comportamento esperado de uma faceta.
 *
 * @param props - Título, opções, seleção corrente e o alternador.
 */
export function FacetFilter({ title, options, selected, onToggle, isPending }: FacetFilterProps) {
  return (
    <section className="flex flex-col">
      <h3 className="text-body-lg leading-10 font-bold">{title}</h3>

      {isPending ? (
        <div className="flex flex-col" aria-hidden="true">
          {Array.from({ length: 4 }, (_unused, index) => (
            <div key={index} className="flex h-10 items-center px-3">
              <div className="skeleton h-4 w-full rounded-sm" />
            </div>
          ))}
        </div>
      ) : (
        <ul className="flex flex-col">
          {options.map((option) => {
            const isSelected = selected.includes(option.id);

            return (
              <li key={option.id}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    onToggle(option.id);
                  }}
                  className={cn(
                    'text-facet rounded-control flex w-full cursor-pointer items-center justify-between gap-2 px-3 text-left',
                    isSelected ? 'text-primary font-bold' : 'text-tan',
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  <span className="shrink-0">({option.count})</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
