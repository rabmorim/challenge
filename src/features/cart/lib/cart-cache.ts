import type { Cart, CartItem } from '@/features/cart/types/cart';
import type { NftUpdatedEvent } from '@/features/realtime/types/events';
import { multiplyEth, quantizeEth, sumEth } from '@/lib/eth';
import type { Quantity } from '@/types/api';

/**
 * Reescritas do carrinho em cache.
 *
 * Sao funcoes puras, fora do React, por dois motivos: entram tanto no update
 * otimista quanto na aplicacao de `nft.updated`, e assim podem ser conferidas
 * sem montar componente.
 *
 * Sobre "o cliente nao calcula": o RESUMO (subtotal, desconto, taxa, total)
 * continua vindo inteiro da cotacao, e nada aqui o toca. O que estas funcoes
 * recalculam e o espelho local do proprio recurso `Cart` — `lineTotal`,
 * `itemCount` e `subtotal` — com a mesma lib decimal e a mesma formula do
 * servidor, para que a linha reaja no mesmo quadro. A resposta REST em seguida
 * sobrescreve o espelho: o socket notifica, o REST confirma.
 */

/**
 * Recalcula os agregados do carrinho a partir das linhas.
 *
 * @param cart - Carrinho de origem.
 * @param items - Linhas ja alteradas.
 * @returns Carrinho com contagem e subtotal coerentes com as linhas.
 */
function withItems(cart: Cart, items: CartItem[]): Cart {
  return {
    ...cart,
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: quantizeEth(sumEth(items.map((item) => item.lineTotal))),
  };
}

/**
 * Aplica uma nova quantidade a uma linha.
 *
 * @param cart - Carrinho em cache.
 * @param itemId - Linha alterada.
 * @param quantity - Nova quantidade inteira.
 * @returns Carrinho com a linha e os agregados atualizados.
 */
export function withItemQuantity(cart: Cart, itemId: string, quantity: Quantity): Cart {
  return withItems(
    cart,
    cart.items.map((item) =>
      item.id === itemId
        ? { ...item, quantity, lineTotal: multiplyEth(item.unitPrice, quantity) }
        : item,
    ),
  );
}

/**
 * Remove uma linha do carrinho.
 *
 * @param cart - Carrinho em cache.
 * @param itemId - Linha removida.
 * @returns Carrinho sem a linha e com os agregados atualizados.
 */
export function withoutItem(cart: Cart, itemId: string): Cart {
  return withItems(
    cart,
    cart.items.filter((item) => item.id !== itemId),
  );
}

/**
 * Aplica `nft.updated` as linhas do carrinho.
 *
 * A guarda de versao esta aqui tambem (e nao so em quem chama) para que a
 * funcao seja segura sozinha: evento antigo ou reentregue nao regride preco
 * nem disponibilidade.
 *
 * @param cart - Carrinho em cache.
 * @param event - Evento recebido pelo `socket.io-client`.
 * @returns Carrinho atualizado, ou o mesmo objeto quando nada se aplica.
 */
export function withNftUpdate(cart: Cart, event: NftUpdatedEvent): Cart {
  const affects = cart.items.some(
    (item) => item.nftId === event.id && event.version > item.nftVersion,
  );
  if (!affects) return cart;

  return withItems(
    cart,
    cart.items.map((item) =>
      item.nftId === event.id && event.version > item.nftVersion
        ? {
            ...item,
            unitPrice: event.payload.price,
            lineTotal: multiplyEth(event.payload.price, item.quantity),
            edition: { ...item.edition, available: event.payload.available },
            nftVersion: event.version,
          }
        : item,
    ),
  );
}
