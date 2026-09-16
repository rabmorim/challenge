import { HttpResponse, http, type HttpHandler } from 'msw';

import { API_PATTERNS } from '@/constants/api';
import { MIN_ITEM_QUANTITY } from '@/features/cart/constants/cart';
import type { AddCartItemRequest, Cart, UpdateCartItemRequest } from '@/features/cart/types/cart';
import {
  addCartItem,
  findCartItem,
  getOrCreateCart,
  removeCartItem,
  serializeCart,
  setCartItemQuantity,
} from '@/mocks/db/cart';
import { toAvailabilityConflict } from '@/mocks/db/pricing';
import { commitDatabase } from '@/mocks/db/store';
import { apiUrl, isResolvedOwner, readJsonBody, requireOwner } from '@/mocks/handlers/shared';
import { conflict, notFound, validationError } from '@/mocks/lib/responses';
import { applyNetworkBehavior } from '@/mocks/scenarios/network';
import type { MockDatabase, NftRecord } from '@/mocks/types/db';
import type { Quantity } from '@/types/api';

/**
 * Carrinho: consulta, inclusao, alteracao e remocao de itens.
 *
 * Funciona para visitante (`x-guest-id`) e para usuario autenticado, com
 * carrinhos separados por dono — o login transfere o do visitante (ver
 * `handlers/auth.ts`). Disponibilidade e limite por pedido sao conferidos aqui,
 * contra o catalogo atual.
 */

/**
 * Confere a quantidade pedida contra o limite por pedido e a disponibilidade.
 *
 * @param nft - NFT do item.
 * @param quantity - Quantidade final pretendida para a linha.
 * @returns Resposta de conflito, ou `null` quando a quantidade cabe.
 */
function checkQuantity(nft: NftRecord, quantity: Quantity): Response | null {
  if (quantity > nft.edition.maxPerOrder) {
    return conflict(
      'QUANTITY_ABOVE_LIMIT',
      `O limite e de ${String(nft.edition.maxPerOrder)} unidade(s) por pedido.`,
      [toAvailabilityConflict(nft, quantity, nft.price)],
    );
  }

  if (quantity > nft.edition.available) {
    return conflict(
      'EDITION_SOLD_OUT',
      nft.edition.available === 0
        ? 'Esta edicao esgotou.'
        : `Restam apenas ${String(nft.edition.available)} unidade(s) desta edicao.`,
      [toAvailabilityConflict(nft, quantity, nft.price)],
    );
  }

  return null;
}

/**
 * Encontra o NFT de um item do carrinho.
 *
 * @param db - Estado do servidor simulado.
 * @param nftId - Id do NFT.
 * @returns Registro ou `undefined`.
 */
function findNftById(db: MockDatabase, nftId: string): NftRecord | undefined {
  return db.nfts.find((candidate) => candidate.id === nftId);
}

/** Handlers do carrinho. */
export const cartHandlers: HttpHandler[] = [
  http.get(apiUrl(API_PATTERNS.cart), async ({ request }) => {
    const failure = await applyNetworkBehavior();
    if (failure) return failure;

    const result = requireOwner(request);
    if (!isResolvedOwner(result)) return result.response;

    const cart = getOrCreateCart(result.db, result.ownerId);
    return HttpResponse.json<Cart>(serializeCart(result.db, cart));
  }),

  http.post(apiUrl(API_PATTERNS.cartItems), async ({ request }) => {
    const failure = await applyNetworkBehavior();
    if (failure) return failure;

    const result = requireOwner(request);
    if (!isResolvedOwner(result)) return result.response;

    const body = await readJsonBody<AddCartItemRequest>(request);
    if (!body?.nftId) return validationError({ nftId: 'Informe o NFT a adicionar.' });

    if (!Number.isInteger(body.quantity) || body.quantity < MIN_ITEM_QUANTITY) {
      return validationError({ quantity: 'Informe uma quantidade inteira maior que zero.' });
    }

    const { db, ownerId } = result;
    const nft = findNftById(db, body.nftId);
    if (!nft) return notFound('Este NFT nao existe ou saiu do catalogo.');

    const cart = getOrCreateCart(db, ownerId);
    const current = cart.items.find((item) => item.nftId === nft.id)?.quantity ?? 0;

    const rejection = checkQuantity(nft, current + body.quantity);
    if (rejection) return rejection;

    addCartItem(cart, nft.id, body.quantity);
    commitDatabase();

    return HttpResponse.json<Cart>(serializeCart(db, cart), { status: 201 });
  }),

  http.patch(apiUrl(API_PATTERNS.cartItemById), async ({ request, params }) => {
    const failure = await applyNetworkBehavior();
    if (failure) return failure;

    const result = requireOwner(request);
    if (!isResolvedOwner(result)) return result.response;

    const body = await readJsonBody<UpdateCartItemRequest>(request);
    if (!body || !Number.isInteger(body.quantity) || body.quantity < MIN_ITEM_QUANTITY) {
      return validationError({ quantity: 'Informe uma quantidade inteira maior que zero.' });
    }

    const { db, ownerId } = result;
    const cart = getOrCreateCart(db, ownerId);
    const item = findCartItem(cart, String(params.itemId));
    if (!item) return notFound('Item nao encontrado no carrinho.');

    const nft = findNftById(db, item.nftId);
    if (!nft) return notFound('Este NFT nao existe ou saiu do catalogo.');

    const rejection = checkQuantity(nft, body.quantity);
    if (rejection) return rejection;

    setCartItemQuantity(cart, item, body.quantity);
    commitDatabase();

    return HttpResponse.json<Cart>(serializeCart(db, cart));
  }),

  http.delete(apiUrl(API_PATTERNS.cartItemById), async ({ request, params }) => {
    const failure = await applyNetworkBehavior();
    if (failure) return failure;

    const result = requireOwner(request);
    if (!isResolvedOwner(result)) return result.response;

    const { db, ownerId } = result;
    const cart = getOrCreateCart(db, ownerId);

    if (!removeCartItem(cart, String(params.itemId))) {
      return notFound('Item nao encontrado no carrinho.');
    }

    commitDatabase();
    return HttpResponse.json<Cart>(serializeCart(db, cart));
  }),
];
