import { Link, createFileRoute } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { CatalogError } from '@/features/catalog/components/catalog-feedback';
import { NftGrid } from '@/features/catalog/components/nft-grid';
import { NftGridSkeleton } from '@/features/catalog/components/nft-grid-skeleton';
import { FAVORITES_COPY } from '@/features/catalog/constants/favorites';
import { useFavorites } from '@/features/catalog/hooks/use-favorites';
import { useNftRealtime } from '@/features/catalog/hooks/use-nft-realtime';

/**
 * Favoritos do colecionador.
 *
 * Não há frame para esta tela no Figma — ela existe porque o frame mobile traz
 * um atalho de favoritos na barra inferior, e porque "favoritos persistem para o
 * usuário autenticado" precisa de um lugar onde isso seja verificável. A
 * composição reusa a grade do catálogo e os tokens do tema.
 *
 * É rota privada: sem sessão, o guard leva ao painel de autenticação guardando
 * o destino, e a volta acontece sozinha depois de entrar.
 */
function FavoritesRoute() {
  const favorites = useFavorites();

  useNftRealtime();

  return (
    <section className="mx-auto flex max-w-(--container-page) flex-col gap-8 px-4 py-10 md:px-6 xl:px-0">
      <h1 className="text-heading">{FAVORITES_COPY.listTitle}</h1>

      <output className="sr-only" aria-live="polite">
        {favorites.announcement}
      </output>

      {favorites.isPending && <NftGridSkeleton />}

      {!favorites.isPending && favorites.isError && (
        <CatalogError error={null} onRetry={favorites.refetch} />
      )}

      {!favorites.isPending && !favorites.isError && favorites.items.length === 0 && (
        <div className="border-input rounded-panel flex flex-col items-center gap-3 border border-dashed px-6 py-16 text-center">
          <h2 className="text-body-lg font-bold">{FAVORITES_COPY.emptyTitle}</h2>
          <p className="text-tan text-body max-w-prose">{FAVORITES_COPY.emptyDescription}</p>
          <Button asChild variant="outline" size="sm">
            <Link to={ROUTES.marketplace}>Ver o catálogo</Link>
          </Button>
        </div>
      )}

      {!favorites.isPending && !favorites.isError && favorites.items.length > 0 && (
        <NftGrid items={favorites.items} favorites={favorites} isRefreshing={false} />
      )}
    </section>
  );
}

export const Route = createFileRoute('/_private/favoritos')({
  component: FavoritesRoute,
});
