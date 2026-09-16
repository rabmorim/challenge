import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { SOCKET_EVENTS } from '@/constants/socket';
import { CATALOG_QUERY_SEGMENTS } from '@/features/catalog/constants/catalog';
import type { NftListResponse } from '@/features/catalog/types/catalog-query';
import type { NftDetail, NftSummary } from '@/features/catalog/types/nft';
import type { NftUpdatedEvent } from '@/features/realtime/types/events';
import { useSocketEvent } from '@/features/realtime/hooks/use-socket-event';
import { queryKeys } from '@/lib/query-keys';

/**
 * Aplica `nft.updated` ao cache do catálogo e do detalhe.
 *
 * O socket **notifica**, o REST **confirma**: o evento só é aplicado quando a
 * `version` que ele carrega é maior que a do recurso em cache. Evento duplicado
 * ou fora de ordem cai fora sem reaplicar efeito e sem regredir um preço mais
 * novo — que é exatamente o que o enunciado §7 exige. A reconciliação após
 * reconexão continua vindo do REST (`refetchOnReconnect`).
 *
 * Monta-se uma vez por tela de catálogo/detalhe; o listener sai no desmonte.
 */
export function useNftRealtime(): void {
  const queryClient = useQueryClient();

  const handleNftUpdated = useCallback(
    (event: NftUpdatedEvent) => {
      /**
       * Aplica a mudança a um recurso, respeitando a versão.
       *
       * @param current - Recurso como está no cache.
       * @returns Recurso atualizado, ou o mesmo objeto quando o evento é velho.
       */
      const merge = <TNft extends NftSummary>(current: TNft): TNft =>
        current.id === event.id && event.version > current.version
          ? {
              ...current,
              version: event.version,
              price: event.payload.price,
              previousPrice: event.payload.previousPrice,
              edition: { ...current.edition, available: event.payload.available },
            }
          : current;

      // Todas as páginas do catálogo já carregadas — o item pode estar em mais
      // de uma (filtros diferentes), e todas precisam concordar.
      queryClient.setQueriesData<NftListResponse>(
        { queryKey: queryKeys.public(CATALOG_QUERY_SEGMENTS.nfts, CATALOG_QUERY_SEGMENTS.list) },
        (current) =>
          current ? { ...current, items: current.items.map((item) => merge(item)) } : current,
      );

      queryClient.setQueriesData<NftDetail>(
        { queryKey: queryKeys.public(CATALOG_QUERY_SEGMENTS.nfts, CATALOG_QUERY_SEGMENTS.detail) },
        (current) => (current ? merge(current) : current),
      );
    },
    [queryClient],
  );

  useSocketEvent(SOCKET_EVENTS.nftUpdated, handleNftUpdated);
}
