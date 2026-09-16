import { describe, expect, it } from 'vitest';

import { login, logout } from '@/features/auth/api/auth-api';
import {
  addCartItem,
  fetchCart,
  removeCartItem,
  updateCartItem,
} from '@/features/cart/api/cart-api';
import { emitNftEvent } from '@/test/mock-control';

/**
 * Carrinho: inclusao, alteracao, remocao, limites por edicao, totais calculados
 * pelo servidor e transferencia do carrinho do visitante ao autenticar.
 */
describe('carrinho', () => {
  it('comeca vazio para o visitante', async () => {
    const cart = await fetchCart();

    expect(cart.items).toEqual([]);
    expect(cart.itemCount).toBe(0);
    expect(cart.subtotal).toBe('0');
  });

  it('soma quantidades e calcula os totais no servidor', async () => {
    await addCartItem({ nftId: 'emerald-ape-042', quantity: 2 });
    const cart = await addCartItem({ nftId: 'golden-beat-207', quantity: 1 });

    expect(cart.itemCount).toBe(3);
    expect(cart.items.map((item) => item.lineTotal)).toEqual(['2.38', '0.99']);
    expect(cart.subtotal).toBe('3.37');
  });

  it('altera a quantidade e remove o item', async () => {
    const created = await addCartItem({ nftId: 'emerald-ape-042', quantity: 1 });
    const itemId = created.items[0]?.id ?? '';

    const updated = await updateCartItem(itemId, 3);
    expect(updated.items[0]?.quantity).toBe(3);
    expect(updated.subtotal).toBe('3.57');

    const emptied = await removeCartItem(itemId);
    expect(emptied.items).toEqual([]);
  });

  it('recusa quantidade acima do limite por pedido', async () => {
    await expect(addCartItem({ nftId: 'emerald-ape-042', quantity: 4 })).rejects.toMatchObject({
      code: 'CONFLICT',
      reason: 'QUANTITY_ABOVE_LIMIT',
      conflicts: [expect.objectContaining({ nftId: 'emerald-ape-042', availableQuantity: 12 })],
    });
  });

  it('recusa item de edicao esgotada', async () => {
    await expect(addCartItem({ nftId: 'golden-signal-160', quantity: 1 })).rejects.toMatchObject({
      code: 'CONFLICT',
      reason: 'EDITION_SOLD_OUT',
    });
  });

  it('recusa quantidade nao inteira', async () => {
    await expect(addCartItem({ nftId: 'emerald-ape-042', quantity: 1.5 })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      fieldErrors: { quantity: expect.stringContaining('inteira') },
    });
  });

  it('reflete a mudanca de preco recebida enquanto o carrinho esta aberto', async () => {
    await addCartItem({ nftId: 'emerald-ape-042', quantity: 2 });

    await emitNftEvent({ nftId: 'emerald-ape-042', price: '1.50' });
    const cart = await fetchCart();

    expect(cart.items[0]?.unitPrice).toBe('1.50');
    expect(cart.items[0]?.lineTotal).toBe('3');
    expect(cart.subtotal).toBe('3');
    // A versao do NFT acompanha a linha: e o que permite descartar evento antigo.
    expect(cart.items[0]?.nftVersion).toBe(2);
  });

  it('transfere o carrinho do visitante para a conta no login', async () => {
    await addCartItem({ nftId: 'cosmic-bloom-118', quantity: 2 });

    await login({ email: 'ana@kurio.dev', password: 'kurio1234' });
    const cart = await fetchCart();

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]?.nftId).toBe('cosmic-bloom-118');
    expect(cart.items[0]?.quantity).toBe(2);
  });

  it('publica a edicao e o token da linha, lidos do catalogo', async () => {
    const cart = await addCartItem({ nftId: 'emerald-ape-042', quantity: 1 });

    expect(cart.items[0]).toMatchObject({
      tokenId: '042',
      edition: { total: 50, available: 12, maxPerOrder: 3 },
    });
  });

  it('apara a fusao do carrinho de visitante no teto da edicao', async () => {
    // A conta ja tem duas unidades; o visitante traz mais duas, e o limite por
    // pedido desta edicao e tres — a soma nao pode criar uma linha que o
    // proprio servidor recusaria no PATCH seguinte.
    await login({ email: 'ana@kurio.dev', password: 'kurio1234' });
    await addCartItem({ nftId: 'emerald-ape-042', quantity: 2 });
    await logout();

    await addCartItem({ nftId: 'emerald-ape-042', quantity: 2 });

    await login({ email: 'ana@kurio.dev', password: 'kurio1234' });
    const cart = await fetchCart();

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]?.quantity).toBe(3);
  });

  it('mantem carrinhos separados por usuario', async () => {
    await login({ email: 'ana@kurio.dev', password: 'kurio1234' });
    await addCartItem({ nftId: 'cosmic-bloom-118', quantity: 1 });

    await login({ email: 'bruno@kurio.dev', password: 'kurio4321' });
    const bruno = await fetchCart();

    expect(bruno.items).toEqual([]);
  });
});
