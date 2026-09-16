import { HttpResponse, http, type HttpHandler } from 'msw';

import { API_PATTERNS } from '@/constants/api';
import type {
  AddFavoriteRequest,
  FavoriteMutationResponse,
  FavoritesResponse,
} from '@/features/catalog/types/favorites';
import { toNftSummary } from '@/mocks/db/catalog';
import { commitDatabase } from '@/mocks/db/store';
import { apiUrl, isActiveSession, readJsonBody, requireSession } from '@/mocks/handlers/shared';
import { notFound, transientFailure, validationError } from '@/mocks/lib/responses';
import { getActiveScenario } from '@/mocks/scenarios/active';
import { applyNetworkBehavior } from '@/mocks/scenarios/network';

/**
 * Favoritos do usuario autenticado.
 *
 * Exigem sessao (enunciado §3) e sao isolados por usuario: a resposta so enxerga
 * as linhas do proprio `userId`. `favoritesCount` acompanha cada mutation para
 * que o update otimista tenha para onde voltar no rollback.
 *
 * A contagem de favoritos nao muda a `version` do NFT nem emite `nft.updated`:
 * o evento carrega preco e disponibilidade, e favoritar nao altera nenhum dos dois.
 */
export const favoriteHandlers: HttpHandler[] = [
  http.get(apiUrl(API_PATTERNS.favorites), async ({ request }) => {
    const failure = await applyNetworkBehavior();
    if (failure) return failure;

    const result = requireSession(request);
    if (!isActiveSession(result)) return result.response;

    const { db, user } = result;
    const nftIds = db.favorites
      .filter((favorite) => favorite.userId === user.id)
      .map((favorite) => favorite.nftId);

    const items = db.nfts.filter((nft) => nftIds.includes(nft.id)).map(toNftSummary);

    return HttpResponse.json<FavoritesResponse>({ nftIds, items });
  }),

  http.post(apiUrl(API_PATTERNS.favorites), async ({ request }) => {
    const failure = await applyNetworkBehavior();
    if (failure) return failure;

    const result = requireSession(request);
    if (!isActiveSession(result)) return result.response;

    if (getActiveScenario().favorites.failMutations) {
      return transientFailure('Nao foi possivel salvar seus favoritos agora.');
    }

    const body = await readJsonBody<AddFavoriteRequest>(request);
    if (!body?.nftId) return validationError({ nftId: 'Informe o NFT a favoritar.' });

    const { db, user } = result;
    const nft = db.nfts.find((candidate) => candidate.id === body.nftId);
    if (!nft) return notFound('Este NFT não existe ou saiu do catálogo.');

    const alreadyFavorited = db.favorites.some(
      (favorite) => favorite.userId === user.id && favorite.nftId === nft.id,
    );

    if (!alreadyFavorited) {
      db.favorites.push({ userId: user.id, nftId: nft.id, createdAt: new Date().toISOString() });
      nft.favoritesCount += 1;
      commitDatabase();
    }

    return HttpResponse.json<FavoriteMutationResponse>({
      nftId: nft.id,
      favorited: true,
      favoritesCount: nft.favoritesCount,
    });
  }),

  http.delete(apiUrl(API_PATTERNS.favoriteByNftId), async ({ request, params }) => {
    const failure = await applyNetworkBehavior();
    if (failure) return failure;

    const result = requireSession(request);
    if (!isActiveSession(result)) return result.response;

    if (getActiveScenario().favorites.failMutations) {
      return transientFailure('Nao foi possivel salvar seus favoritos agora.');
    }

    const { db, user } = result;
    const nftId = String(params.nftId);
    const nft = db.nfts.find((candidate) => candidate.id === nftId);
    if (!nft) return notFound('Este NFT não existe ou saiu do catálogo.');

    const before = db.favorites.length;
    db.favorites = db.favorites.filter(
      (favorite) => !(favorite.userId === user.id && favorite.nftId === nftId),
    );

    if (db.favorites.length < before) {
      nft.favoritesCount = Math.max(0, nft.favoritesCount - 1);
      commitDatabase();
    }

    return HttpResponse.json<FavoriteMutationResponse>({
      nftId,
      favorited: false,
      favoritesCount: nft.favoritesCount,
    });
  }),
];
