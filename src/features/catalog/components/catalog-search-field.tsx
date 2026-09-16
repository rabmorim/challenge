import { useNavigate } from '@tanstack/react-router';
import { SearchIcon } from 'lucide-react';
import { useId, useState } from 'react';

import { ROUTES } from '@/constants/routes';
import { CATALOG_COPY } from '@/features/catalog/constants/catalog-copy';
import { cn } from '@/lib/utils';

/**
 * Campo de busca em largura total do frame de 414.
 *
 * Medidas do frame: caixa de 45px sobre `#241612`, raio 10, lupa de 18.33px à
 * esquerda em `#B39463` e texto 14/16 bold no mesmo tom. O recuo à direita
 * existe no frame porque nada mais ocupa a caixa — aqui ele é o respiro do
 * próprio texto.
 *
 * É um `form` de verdade: enviar leva ao Mercado com `?search=`, então a busca
 * entra na URL e sobrevive ao refresh e ao histórico como os demais filtros.
 * Não há botão de envio visível (o frame não desenha nenhum) — `Enter` envia, e
 * a lupa é decorativa, com o nome da ação no rótulo do campo.
 */
export function CatalogSearchField() {
  const navigate = useNavigate();
  const inputId = useId();
  const [term, setTerm] = useState('');

  return (
    <search className="min-w-0 flex-1">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void navigate({
            to: ROUTES.marketplace,
            search: term.trim().length > 0 ? { search: term.trim() } : {},
          });
        }}
      >
        <label className="sr-only" htmlFor={inputId}>
          {CATALOG_COPY.searchLabel}
        </label>

        {/* O anel de foco fica na CAIXA, e não no `input`: o campo ocupa os
            45px inteiros do frame, então um contorno nele mesmo desenharia um
            retângulo dentro da caixa arredondada. Com `has-[:focus-visible]` o
            indicador acompanha a moldura que a pessoa enxerga. */}
        <div
          className={cn(
            'bg-card rounded-field relative flex h-[45px] items-center',
            'has-[:focus-visible]:outline-ring has-[:focus-visible]:outline-solid has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2',
          )}
        >
          <SearchIcon
            className="text-icon-muted pointer-events-none absolute left-[14px] size-[18.33px]"
            aria-hidden="true"
          />
          <input
            id={inputId}
            name="search"
            type="search"
            placeholder={CATALOG_COPY.searchPlaceholder}
            value={term}
            onChange={(event) => {
              setTerm(event.target.value);
            }}
            className="text-field text-foreground placeholder:text-icon-muted h-full w-full min-w-0 bg-transparent pr-4 pl-[43px] outline-none"
          />
        </div>
      </form>
    </search>
  );
}
