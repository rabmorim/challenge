import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';

import { SOCKET_EVENTS } from '@/constants/socket';
import { cartQueryOptions } from '@/features/cart/api/cart-queries';
import { CART_REALTIME_COPY } from '@/features/cart/constants/cart-copy';
import { useCartOwner } from '@/features/cart/hooks/use-cart-owner';
import { withNftUpdate } from '@/features/cart/lib/cart-cache';
import { clampCartQuantity } from '@/features/cart/lib/cart-quantity';
import type { Cart } from '@/features/cart/types/cart';
import type { CartRealtimeOptions } from '@/features/cart/types/cart-state';
import { useSocketEvent } from '@/features/realtime/hooks/use-socket-event';
import type { NftUpdatedEvent } from '@/features/realtime/types/events';
import { compareEth } from '@/lib/eth';

/**
 * `nft.updated` com o carrinho aberto.
 *
 * É o cenário do enunciado §7, passos 1 a 3: o item está no carrinho, o preço
 * ou a disponibilidade muda durante a navegação, e a interface **informa** a
 * alteração e atualiza o resumo.
 *
 * **Versão e deduplicação.** O hook guarda a última versão vista por NFT e só
 * age quando a do evento é maior — tanto contra a versão guardada quanto contra
 * a que está na linha em cache. Duplicata e evento antigo caem fora sem
 * reaplicar efeito e sem regredir um estado mais novo: nada de preço que volta
 * atrás, nada de aviso repetido, nada de segundo ajuste de quantidade. O mapa é
 * limpo na troca de dono, porque versões do usuário anterior não dizem nada
 * sobre o carrinho do seguinte.
 *
 * **Recotagem.** Não há chamada explícita: a versão do NFT faz parte da
 * assinatura que identifica a cotação, então aplicar o evento à linha muda a
 * query key do resumo e o novo valor é buscado por construção (ver
 * `quoteQueryOptions`). O REST confirma logo em seguida — o socket notifica,
 * a API tem a última palavra.
 *
 * **Disponibilidade abaixo da quantidade.** A linha é aparada no novo teto por
 * quem monta o hook (`onAvailabilityDrop`), porque aparar é uma mutation do
 * carrinho e não uma escrita em cache. Edição esgotada não apara para zero:
 * o item continua na tela, avisado, e a saída fica com o usuário.
 *
 * O listener sai no desmonte e é religado na troca de conexão — os dois
 * cuidados vivem em `useSocketEvent`.
 *
 * @param options - Anunciador da região viva e o ajuste de quantidade.
 */
export function useCartRealtime({ announce, onAvailabilityDrop }: CartRealtimeOptions): void {
  const owner = useCartOwner();
  const queryClient = useQueryClient();
  const { queryKey } = cartQueryOptions(owner);

  /**
   * Última versão vista por NFT, carimbada com o dono a quem ela pertence.
   * O dono viaja junto (em vez de um efeito de limpeza) para que a troca de
   * conta zere o histórico no mesmo instante em que o primeiro evento chega —
   * versões do usuário anterior não dizem nada sobre o carrinho do seguinte.
   */
  const seen = useRef<{ owner: string; versions: Map<string, number> }>({
    owner,
    versions: new Map(),
  });

  const handleNftUpdated = useCallback(
    (event: NftUpdatedEvent) => {
      if (seen.current.owner !== owner) seen.current = { owner, versions: new Map() };

      const { versions } = seen.current;
      const lastSeen = versions.get(event.id);
      if (lastSeen !== undefined && event.version <= lastSeen) return;

      const cart = queryClient.getQueryData<Cart>(queryKey);
      const item = cart?.items.find((candidate) => candidate.nftId === event.id);
      // O evento é de um NFT que não está neste carrinho: o catálogo cuida dele.
      if (!item) return;

      if (event.version <= item.nftVersion) {
        versions.set(event.id, item.nftVersion);
        return;
      }

      versions.set(event.id, event.version);

      queryClient.setQueryData<Cart>(queryKey, (current) =>
        current ? withNftUpdate(current, event) : current,
      );
      // O socket notifica, o REST confirma: a resposta seguinte traz o carrinho
      // recalculado pelo servidor por cima do espelho local.
      void queryClient.invalidateQueries({ queryKey });

      const { price, available } = event.payload;

      if (available === 0) {
        announce(CART_REALTIME_COPY.soldOut(item.name));
        return;
      }

      if (available < item.quantity) {
        // A apara sai calada (ver `setQuantity`): o aviso abaixo diz o motivo,
        // que é a informação que o genérico "quantidade alterada" perderia.
        onAvailabilityDrop(item, clampCartQuantity(available, { ...item.edition, available }));
        announce(CART_REALTIME_COPY.availabilityClamped(item.name, available));
        return;
      }

      if (compareEth(price, item.unitPrice) !== 0) {
        announce(CART_REALTIME_COPY.priceChanged(item.name, price));
        return;
      }

      announce(CART_REALTIME_COPY.availabilityChanged(item.name, available));
    },
    [announce, onAvailabilityDrop, owner, queryClient, queryKey],
  );

  useSocketEvent(SOCKET_EVENTS.nftUpdated, handleNftUpdated);
}
