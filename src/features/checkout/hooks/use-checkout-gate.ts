import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { SOCKET_EVENTS } from '@/constants/socket';
import { cartQueryOptions } from '@/features/cart/api/cart-queries';
import { useCartOwner } from '@/features/cart/hooks/use-cart-owner';
import { withNftUpdate } from '@/features/cart/lib/cart-cache';
import type { Cart } from '@/features/cart/types/cart';
import { STALE_QUOTE_COPY } from '@/features/checkout/constants/checkout-copy';
import type {
  CheckoutGateApi,
  CheckoutGateOptions,
  StaleQuoteBlock,
} from '@/features/checkout/types/checkout-state';
import { useSocketEvent } from '@/features/realtime/hooks/use-socket-event';
import type { NftUpdatedEvent } from '@/features/realtime/types/events';
import { compareEth } from '@/lib/eth';
import type { AvailabilityConflict } from '@/types/api';
import type { NormalizedHttpError } from '@/types/http';

/**
 * O portao que impede finalizar com uma cotacao desatualizada.
 *
 * O enunciado §7 termina com "o checkout impede a confirmacao com uma cotacao
 * desatualizada", e essa e a unica responsabilidade daqui. O portao sobe por
 * tres origens — todas **fora do controle do usuario**:
 *
 * 1. `nft.updated` chegando pelo `socket.io-client` para um item em compra, com
 *    preco diferente ou disponibilidade abaixo da quantidade pedida;
 * 2. o `409` de `POST /orders` (`PRICE_CHANGED`, `EDITION_SOLD_OUT`,
 *    `QUOTE_STALE`, `QUOTE_EXPIRED`), cujos `conflicts` ja dizem o que mudou;
 * 3. a validade da propria cotacao vencendo com a tela aberta.
 *
 * Mudanca que o **usuario** provoca — trocar o cupom ou a rede — recota em
 * silencio: exigir nova confirmacao de uma acao que ele acabou de tomar seria
 * ruido, nao seguranca.
 *
 * **Deduplicacao por versao.** O mapa de versoes vistas e carimbado com o dono,
 * como no carrinho: evento antigo ou reentregue nao reaplica efeito, nao
 * regride preco e nao levanta o bloqueio duas vezes.
 *
 * **Quem recota.** O portao aplica o evento a linha do carrinho em cache (com a
 * guarda de versao de `withNftUpdate`) e pede a revalidacao; como a versao do
 * NFT faz parte da assinatura da cotacao, a recotagem acontece por construcao.
 * Enquanto ela nao chega, `isRefreshing` mantem o botao de aceitar travado —
 * aceitar valores que ainda estao a caminho seria confirmar no escuro.
 *
 * @param options - Itens em compra, cotacao, estado da recotagem e callbacks.
 * @returns Bloqueio corrente e as acoes de levantar e aceitar.
 */
export function useCheckoutGate({
  items,
  quote,
  isRefreshing,
  announce,
  onStale,
}: CheckoutGateOptions): CheckoutGateApi {
  const owner = useCartOwner();
  const queryClient = useQueryClient();
  const { queryKey } = cartQueryOptions(owner);

  const [block, setBlock] = useState<StaleQuoteBlock | null>(null);

  /** Ultima versao vista por NFT, carimbada com o dono a quem ela pertence. */
  const seen = useRef<{ owner: string; versions: Map<string, number> }>({
    owner,
    versions: new Map(),
  });

  /** Cotacao cuja expiracao ja foi anunciada — evita bloquear em repeticao. */
  const expiredQuoteId = useRef<string | null>(null);

  /**
   * `onStale` em uma ref porque a tela o recria a cada render (ele fecha sobre
   * `refetch` de duas queries). Sem isso, o tratador do evento mudaria de
   * identidade sempre e o listener do socket seria desligado e religado em
   * todo render — trabalho por nada em um caminho que precisa ser estavel.
   */
  const onStaleRef = useRef(onStale);

  useEffect(() => {
    onStaleRef.current = onStale;
  }, [onStale]);

  const raise = useCallback(
    (next: StaleQuoteBlock, message: string) => {
      setBlock(next);
      announce(message);
      onStaleRef.current();
    },
    [announce],
  );

  const handleNftUpdated = useCallback(
    (event: NftUpdatedEvent) => {
      if (seen.current.owner !== owner) seen.current = { owner, versions: new Map() };

      const { versions } = seen.current;
      const lastSeen = versions.get(event.id);
      if (lastSeen !== undefined && event.version <= lastSeen) return;

      const item = items.find((candidate) => candidate.nftId === event.id);
      // Evento de um NFT que nao esta nesta compra: o catalogo cuida dele.
      if (!item) return;

      if (event.version <= item.nftVersion) {
        versions.set(event.id, item.nftVersion);
        return;
      }

      versions.set(event.id, event.version);

      // O espelho local acompanha o evento; o REST confirma logo em seguida.
      queryClient.setQueryData<Cart>(queryKey, (current) =>
        current ? withNftUpdate(current, event) : current,
      );

      const { price, available } = event.payload;
      const quotedPrice = quote?.lines.find((line) => line.nftId === event.id)?.unitPrice;
      const priceChanged = compareEth(price, item.unitPrice) !== 0;
      const shortSupply = available < item.quantity;

      // Disponibilidade que SOBE com o mesmo preco nao invalida a compra: a
      // versao do recurso sobe em qualquer alteracao, e bloquear por isso seria
      // falso positivo (a mesma regra que o servidor aplica ao revalidar).
      if (!priceChanged && !shortSupply) return;

      const conflict: AvailabilityConflict = {
        nftId: item.nftId,
        name: item.name,
        quotedPrice: quotedPrice ?? item.unitPrice,
        currentPrice: price,
        requestedQuantity: item.quantity,
        availableQuantity: available,
        version: event.version,
      };

      raise({ source: 'realtime', message: '', conflicts: [conflict] }, STALE_QUOTE_COPY.announce);
    },
    [items, owner, queryClient, queryKey, quote, raise],
  );

  useSocketEvent(SOCKET_EVENTS.nftUpdated, handleNftUpdated);

  // Cotacao com prazo: quando ele passa com a tela aberta, o pedido seria
  // recusado com `QUOTE_EXPIRED`. Bloquear antes evita gastar a tentativa.
  useEffect(() => {
    if (!quote) return;

    const remaining = Date.parse(quote.expiresAt) - Date.now();

    if (remaining <= 0) {
      if (expiredQuoteId.current === quote.id) return;
      expiredQuoteId.current = quote.id;
      raise({ source: 'expired', message: '', conflicts: [] }, STALE_QUOTE_COPY.expired);
      return;
    }

    const timer = setTimeout(() => {
      expiredQuoteId.current = quote.id;
      raise({ source: 'expired', message: '', conflicts: [] }, STALE_QUOTE_COPY.expired);
    }, remaining);

    return () => {
      clearTimeout(timer);
    };
  }, [quote, raise]);

  const blockFromError = useCallback(
    (error: NormalizedHttpError) => {
      const isStaleQuote =
        error.reason === 'PRICE_CHANGED' ||
        error.reason === 'EDITION_SOLD_OUT' ||
        error.reason === 'QUOTE_STALE' ||
        error.reason === 'QUOTE_EXPIRED';

      if (!isStaleQuote) return false;

      raise(
        { source: 'conflict', message: error.message, conflicts: error.conflicts ?? [] },
        STALE_QUOTE_COPY.announce,
      );
      return true;
    },
    [raise],
  );

  const acknowledge = useCallback(() => {
    setBlock(null);
  }, []);

  return { block, isRefreshing, blockFromError, acknowledge };
}
