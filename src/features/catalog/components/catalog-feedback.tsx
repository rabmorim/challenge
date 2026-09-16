import { Button } from '@/components/ui/button';
import { CATALOG_COPY } from '@/features/catalog/constants/catalog-copy';
import type { CatalogEmptyProps, CatalogErrorProps } from '@/features/catalog/types/catalog-components';
import { isHttpError } from '@/lib/http';

/**
 * Resultado vazio.
 *
 * Vazio não é erro: a tela explica o que fazer e, quando há filtro aplicado,
 * oferece o caminho de volta em vez de deixar o visitante sem saída.
 *
 * @param props - Se há filtros ativos e como limpá-los.
 */
export function CatalogEmpty({ hasFilters, onClearFilters }: CatalogEmptyProps) {
  return (
    <div
      data-testid="catalog-empty"
      className="border-input flex flex-col items-center gap-3 rounded-panel border border-dashed px-6 py-16 text-center"
    >
      <h3 className="text-body-lg font-bold">{CATALOG_COPY.emptyTitle}</h3>
      <p className="text-tan text-body max-w-prose">{CATALOG_COPY.emptyDescription}</p>
      {hasFilters && (
        <Button variant="outline" size="sm" onClick={onClearFilters}>
          {CATALOG_COPY.clearFilters}
        </Button>
      )}
    </div>
  );
}

/**
 * Falha na consulta, com nova tentativa.
 *
 * A mensagem vem do erro normalizado pelo Axios (já em português), e o botão
 * refaz a mesma consulta — o estado de recuperação que o cenário 12 exercita.
 *
 * @param props - Erro recebido e o que fazer ao tentar de novo.
 */
export function CatalogError({ error, onRetry }: CatalogErrorProps) {
  return (
    <div
      data-testid="catalog-error"
      role="alert"
      className="border-destructive/50 flex flex-col items-center gap-3 rounded-panel border px-6 py-16 text-center"
    >
      <h3 className="text-body-lg font-bold">{CATALOG_COPY.errorTitle}</h3>
      <p className="text-tan text-body max-w-prose">
        {isHttpError(error) ? error.message : 'Erro inesperado ao falar com a API.'}
      </p>
      <Button size="sm" onClick={onRetry}>
        {CATALOG_COPY.errorRetry}
      </Button>
    </div>
  );
}
