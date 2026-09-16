import { API_PATHS } from '@/constants/api';
import type { AddCartItemRequest, Cart } from '@/features/cart/types/cart';
import { httpClient } from '@/lib/http';
import type { Quantity } from '@/types/api';

/**
 * Chamadas REST do carrinho.
 *
 * Funcionam para visitante e para usuario autenticado: a identidade vai nos
 * cabecalhos anexados pelo interceptor do Axios. Toda resposta traz o carrinho
 * inteiro (com subtotal calculado no servidor), o que dispensa recomposicao no
 * cliente depois de cada mutation.
 */

/**
 * Consulta o carrinho do dono corrente.
 *
 * @param signal - `AbortSignal` do TanStack Query.
 * @returns Carrinho com linhas, contagem e subtotal.
 */
export async function fetchCart(signal?: AbortSignal): Promise<Cart> {
  const { data } = await httpClient.get<Cart>(API_PATHS.cart, signal ? { signal } : undefined);
  return data;
}

/**
 * Acrescenta unidades de um NFT ao carrinho.
 *
 * @param body - NFT e quantidade a somar.
 * @returns Carrinho atualizado.
 * @throws {NormalizedHttpError} `CONFLICT` com `EDITION_SOLD_OUT` ou
 *   `QUANTITY_ABOVE_LIMIT` quando a quantidade nao cabe.
 */
export async function addCartItem(body: AddCartItemRequest): Promise<Cart> {
  const { data } = await httpClient.post<Cart>(API_PATHS.cartItems, body);
  return data;
}

/**
 * Altera a quantidade de um item do carrinho.
 *
 * @param itemId - Id do item (nao e o id do NFT).
 * @param quantity - Nova quantidade inteira.
 * @returns Carrinho atualizado.
 */
export async function updateCartItem(itemId: string, quantity: Quantity): Promise<Cart> {
  const { data } = await httpClient.patch<Cart>(API_PATHS.cartItemById(itemId), { quantity });
  return data;
}

/**
 * Remove um item do carrinho.
 *
 * @param itemId - Id do item.
 * @returns Carrinho atualizado.
 */
export async function removeCartItem(itemId: string): Promise<Cart> {
  const { data } = await httpClient.delete<Cart>(API_PATHS.cartItemById(itemId));
  return data;
}
