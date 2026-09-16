import { HttpResponse, http, type HttpHandler } from 'msw';

import { API_PATTERNS } from '@/constants/api';
import type { NftListResponse } from '@/features/catalog/types/catalog-query';
import type { NftDetail } from '@/features/catalog/types/nft';
import { findNft, parseNftListParams, selectNfts, toNftDetail } from '@/mocks/db/catalog';
import { getDatabase } from '@/mocks/db/store';
import { apiUrl } from '@/mocks/handlers/shared';
import { notFound } from '@/mocks/lib/responses';
import { getActiveScenario } from '@/mocks/scenarios/active';
import { applyNetworkBehavior } from '@/mocks/scenarios/network';

/**
 * Catalogo: listagem com busca/filtros/ordenacao/paginacao e detalhe por id.
 *
 * Os dois endpoints sao publicos (visitante navega sem entrar) e refletem
 * exatamente os parametros recebidos — a resposta informa a ordenacao e a aba
 * aplicadas para que a interface nunca precise supor.
 */
export const nftHandlers: HttpHandler[] = [
  http.get(apiUrl(API_PATTERNS.nfts), async ({ request }) => {
    const failure = await applyNetworkBehavior();
    if (failure) return failure;

    const params = parseNftListParams(new URL(request.url));
    const response = selectNfts(getDatabase(), params, getActiveScenario().catalog.empty);

    return HttpResponse.json<NftListResponse>(response);
  }),

  http.get(apiUrl(API_PATTERNS.nftById), async ({ params }) => {
    const failure = await applyNetworkBehavior();
    if (failure) return failure;

    const identifier = String(params.nftId);
    const nft = findNft(getDatabase(), identifier);

    if (!nft) return notFound('Este NFT não existe ou saiu do catálogo.');

    return HttpResponse.json<NftDetail>(toNftDetail(nft));
  }),
];
