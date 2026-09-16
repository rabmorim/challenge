import { MIN_ITEM_QUANTITY } from '@/features/cart/constants/cart';
import type { Cart, CartItem } from '@/features/cart/types/cart';
import { multiplyEth, sumEth } from '@/lib/eth';
import { createCartItemId } from '@/mocks/lib/ids';
import type { CartItemRecord, CartRecord, MockDatabase, NftRecord } from '@/mocks/types/db';
import type { Quantity } from '@/types/api';

/**
 * Carrinho do servidor simulado.
 *
 * O carrinho guarda apenas `nftId` e quantidade: preco, disponibilidade e
 * limite por pedido sao lidos do catalogo a cada resposta. E o que faz uma
 * mudanca de preco aparecer no carrinho sem nenhuma sincronizacao extra — e o
 * que impede o carrinho de "congelar" um preco que a cotacao vai desmentir.
 *
 * `ownerId` e o id do usuario autenticado ou a identidade do visitante
 * (`guest:<id>`), o que isola os carrinhos entre sessoes.
 */

/**
 * Encontra o carrinho de um dono.
 *
 * @param db - Estado do servidor simulado.
 * @param ownerId - Dono do carrinho.
 * @returns Carrinho existente ou `undefined`.
 */
export function findCart(db: MockDatabase, ownerId: string): CartRecord | undefined {
  return db.carts.find((cart) => cart.ownerId === ownerId);
}

/**
 * Devolve o carrinho do dono, criando um vazio na primeira vez.
 *
 * @param db - Estado do servidor simulado.
 * @param ownerId - Dono do carrinho.
 * @returns Carrinho do dono.
 */
export function getOrCreateCart(db: MockDatabase, ownerId: string): CartRecord {
  const existing = findCart(db, ownerId);
  if (existing) return existing;

  const cart: CartRecord = {
    ownerId,
    items: [],
    version: 1,
    updatedAt: new Date().toISOString(),
  };

  db.carts.push(cart);
  return cart;
}

/**
 * Marca o carrinho como alterado: sobe a versao e atualiza o horario.
 * A versao e o que permite a interface descartar respostas fora de ordem.
 *
 * @param cart - Carrinho alterado.
 */
function touchCart(cart: CartRecord): void {
  cart.version += 1;
  cart.updatedAt = new Date().toISOString();
}

/**
 * Monta a linha do carrinho a partir do item e do NFT atual.
 *
 * @param item - Item persistido.
 * @param nft - NFT correspondente, com preco e disponibilidade atuais.
 * @returns Linha do contrato, com total calculado pelo servidor.
 */
function toCartItem(item: CartItemRecord, nft: NftRecord): CartItem {
  return {
    id: item.id,
    nftId: nft.id,
    slug: nft.slug,
    name: nft.name,
    tokenId: nft.tokenId,
    imageUrl: nft.imageUrl,
    imageAlt: nft.imageAlt,
    network: nft.network,
    unitPrice: nft.price,
    quantity: item.quantity,
    lineTotal: multiplyEth(nft.price, item.quantity),
    edition: { ...nft.edition },
    nftVersion: nft.version,
    addedAt: item.addedAt,
  };
}

/**
 * Converte o carrinho persistido no contrato publicado pela API.
 * Itens cujo NFT desapareceu do catalogo sao descartados da resposta.
 *
 * @param db - Estado do servidor simulado.
 * @param cart - Carrinho do dono.
 * @returns Carrinho com linhas, subtotal e contagem calculados pelo servidor.
 */
export function serializeCart(db: MockDatabase, cart: CartRecord): Cart {
  const items = cart.items.flatMap((item) => {
    const nft = db.nfts.find((candidate) => candidate.id === item.nftId);
    return nft ? [toCartItem(item, nft)] : [];
  });

  return {
    id: cart.ownerId,
    version: cart.version,
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: sumEth(items.map((item) => item.lineTotal)),
    updatedAt: cart.updatedAt,
  };
}

/**
 * Acrescenta unidades de um NFT ao carrinho (ou cria a linha).
 *
 * @param cart - Carrinho do dono.
 * @param nftId - NFT a incluir.
 * @param quantity - Unidades a somar.
 * @returns Quantidade final da linha.
 */
export function addCartItem(cart: CartRecord, nftId: string, quantity: Quantity): Quantity {
  const existing = cart.items.find((item) => item.nftId === nftId);

  if (existing) {
    existing.quantity += quantity;
    touchCart(cart);
    return existing.quantity;
  }

  cart.items.push({
    id: createCartItemId(),
    nftId,
    quantity,
    addedAt: new Date().toISOString(),
  });
  touchCart(cart);

  return quantity;
}

/**
 * Encontra um item pelo id.
 *
 * @param cart - Carrinho do dono.
 * @param itemId - Id do item.
 * @returns Item ou `undefined`.
 */
export function findCartItem(cart: CartRecord, itemId: string): CartItemRecord | undefined {
  return cart.items.find((item) => item.id === itemId);
}

/**
 * Define a quantidade de um item.
 *
 * @param cart - Carrinho do dono.
 * @param item - Item a alterar.
 * @param quantity - Nova quantidade (inteira e maior que zero).
 */
export function setCartItemQuantity(
  cart: CartRecord,
  item: CartItemRecord,
  quantity: Quantity,
): void {
  item.quantity = quantity;
  touchCart(cart);
}

/**
 * Remove um item do carrinho.
 *
 * @param cart - Carrinho do dono.
 * @param itemId - Id do item a remover.
 * @returns `true` quando o item existia.
 */
export function removeCartItem(cart: CartRecord, itemId: string): boolean {
  const index = cart.items.findIndex((item) => item.id === itemId);
  if (index < 0) return false;

  cart.items.splice(index, 1);
  touchCart(cart);
  return true;
}

/**
 * Transfere o carrinho do visitante para a conta ao autenticar.
 *
 * Regra da fusao, por linha:
 *
 * 1. **soma** a quantidade do visitante a que a conta ja tinha do mesmo NFT;
 * 2. **limita** o resultado ao teto real da edicao no momento do login
 *    (`min(maxPerOrder, available)`) — entrar na conta nao pode criar uma linha
 *    que o proprio servidor recusaria no `PATCH`;
 * 3. **descarta** a linha cujo NFT saiu do catalogo ou cuja edicao esgotou
 *    (teto abaixo de uma unidade), porque nao ha quantidade valida a transferir.
 *
 * O carrinho de origem e sempre descartado ao fim, de modo que a operacao e
 * idempotente: um segundo login nao tem mais o que mesclar nem duplica linhas.
 *
 * @param db - Estado do servidor simulado.
 * @param fromOwnerId - Dono de origem (visitante).
 * @param toOwnerId - Dono de destino (usuario autenticado).
 * @returns Quantidade de linhas efetivamente transferidas.
 */
export function mergeCarts(db: MockDatabase, fromOwnerId: string, toOwnerId: string): number {
  const source = findCart(db, fromOwnerId);
  if (!source || source.items.length === 0 || fromOwnerId === toOwnerId) return 0;

  const target = getOrCreateCart(db, toOwnerId);
  let merged = 0;

  for (const item of source.items) {
    const nft = db.nfts.find((candidate) => candidate.id === item.nftId);
    if (!nft) continue;

    const ceiling = Math.min(nft.edition.maxPerOrder, nft.edition.available);
    if (ceiling < MIN_ITEM_QUANTITY) continue;

    const existing = target.items.find((candidate) => candidate.nftId === item.nftId);
    const quantity = Math.min((existing?.quantity ?? 0) + item.quantity, ceiling);

    if (!existing) {
      addCartItem(target, item.nftId, quantity);
      merged += 1;
      continue;
    }

    if (quantity === existing.quantity) continue;
    setCartItemQuantity(target, existing, quantity);
    merged += 1;
  }

  db.carts = db.carts.filter((cart) => cart.ownerId !== fromOwnerId);
  return merged;
}

/**
 * Remove do carrinho apenas os itens e quantidades efetivamente comprados.
 * Uma compra parcial (quantidade menor que a do carrinho) deixa o resto la.
 *
 * @param db - Estado do servidor simulado.
 * @param ownerId - Dono do carrinho.
 * @param purchased - Itens comprados, com as quantidades confirmadas.
 */
export function removePurchasedItems(
  db: MockDatabase,
  ownerId: string,
  purchased: Array<{ nftId: string; quantity: Quantity }>,
): void {
  const cart = findCart(db, ownerId);
  if (!cart) return;

  for (const bought of purchased) {
    const item = cart.items.find((candidate) => candidate.nftId === bought.nftId);
    if (!item) continue;

    if (item.quantity > bought.quantity) {
      item.quantity -= bought.quantity;
      continue;
    }

    cart.items = cart.items.filter((candidate) => candidate.id !== item.id);
  }

  touchCart(cart);
}
