import { useNavigate } from '@tanstack/react-router';
import { SearchIcon, XIcon } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { ROUTES } from '@/constants/routes';
import { CATALOG_COPY } from '@/features/catalog/constants/catalog-copy';

/**
 * Busca do header (desktop).
 *
 * Compõe o estado da URL do catálogo: enviar leva ao Mercado com `?search=`, o
 * que faz a busca sobreviver ao refresh e ao histórico como qualquer outro
 * filtro. O campo é um `form` de verdade, com rótulo associado — envio por
 * Enter funciona sem tratador de tecla.
 *
 * O frame de 1440 mostra apenas a lupa; ela alterna o campo, que recebe foco ao
 * abrir para a interação por teclado continuar de onde estava (o foco é movido
 * por referência, não por `autoFocus`, que também se aplicaria ao carregamento
 * da página).
 *
 * Em celulares a busca não vive aqui: o frame de 414 a coloca em largura total
 * no topo da tela, ao lado do botão de filtros (`CatalogSearchBar`).
 */
export function HeaderSearch() {
  const navigate = useNavigate();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [term, setTerm] = useState('');

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={inputId}
        aria-label={isOpen ? CATALOG_COPY.searchClear : CATALOG_COPY.searchLabel}
        onClick={() => {
          setIsOpen((open) => !open);
        }}
        className="text-foreground rounded-control flex size-9 cursor-pointer items-center justify-center"
      >
        {isOpen ? (
          <XIcon className="size-5" aria-hidden="true" />
        ) : (
          <SearchIcon className="size-5" aria-hidden="true" />
        )}
      </button>

      <search hidden={!isOpen}>
        <form
          className="flex items-center gap-2"
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
          <Input
            id={inputId}
            ref={inputRef}
            name="search"
            type="search"
            placeholder={CATALOG_COPY.searchPlaceholder}
            value={term}
            onChange={(event) => {
              setTerm(event.target.value);
            }}
            className="py-2 md:w-56"
          />
          <button
            type="submit"
            aria-label={CATALOG_COPY.searchSubmit}
            className="bg-primary text-primary-foreground rounded-control flex size-9 shrink-0 cursor-pointer items-center justify-center"
          >
            <SearchIcon className="size-4" aria-hidden="true" />
          </button>
        </form>
      </search>
    </div>
  );
}
