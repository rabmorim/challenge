import type { Order } from '@/features/checkout/types/order';
import { DEFAULT_SCENARIO, EXPLORER_BASE_URL } from '@/mocks/constants';
import type { NftRecord, ReceiptRecord } from '@/mocks/types/db';

/** Numero sequencial da referencia do pedido semeado. */
export const SEED_ORDER_SEQUENCE = 101;

/** Hash simulado da transacao do pedido semeado. */
const SEED_TRANSACTION_HASH = '0x9c4d1f7a2e58b0369d4c7a1e5f83b09248c6d17a3e5b9f024c8d1a67b3e59f04';

/** NFT comprado no pedido semeado. */
const SEED_ORDER_NFT_SLUG = 'golden-beat-207';

/**
 * Pedido confirmado ja existente na conta da Ana.
 *
 * Serve a dois propositos: dar conteudo a lista de pedidos/perfil sem depender
 * de uma compra feita no teste, e provar que o recibo e um snapshot — mudar o
 * preco do NFT depois nao altera nada aqui. Os totais estao literais de
 * proposito: sao o resultado congelado do calculo do servidor no momento da
 * compra (subtotal 0.99 + taxa Ethereum 0.0042 + 0.0009 por item).
 *
 * @param nfts - Catalogo semeado, usado para copiar os dados de exibicao do item.
 * @returns Pedido e recibo correspondentes, ou listas vazias se o NFT nao existir.
 */
export function buildSeedOrders(nfts: NftRecord[]): {
  orders: Order[];
  receipts: ReceiptRecord[];
} {
  const nft = nfts.find((candidate) => candidate.slug === SEED_ORDER_NFT_SLUG);
  if (!nft) return { orders: [], receipts: [] };

  const order: Order = {
    id: 'order-seed-ana',
    version: 2,
    reference: `KUR-${String(SEED_ORDER_SEQUENCE).padStart(6, '0')}`,
    status: 'confirmed',
    userId: 'user-ana',
    items: [
      {
        nftId: nft.id,
        slug: nft.slug,
        name: nft.name,
        imageUrl: nft.imageUrl,
        imageAlt: nft.imageAlt,
        tokenId: nft.tokenId,
        unitPrice: '0.99',
        quantity: 1,
        lineTotal: '0.99',
      },
    ],
    totals: {
      subtotal: '0.99',
      discount: '0',
      networkFee: '0.0051',
      total: '0.9951',
    },
    coupon: null,
    network: 'ethereum',
    walletId: 'wallet-ana-primary',
    walletAddress: '0xA91F7c3b0d5e2481a6f09c4b7d3e150f9a26E82C',
    collector: {
      displayName: 'Ana Ribeiro',
      username: 'ana.colecionadora',
      profileName: 'Acervo Ribeiro',
      email: 'ana@kurio.dev',
      walletAddress: '0xA91F7c3b0d5e2481a6f09c4b7d3e150f9a26E82C',
      secondaryWallet: null,
      referralCode: 'KURIO-ANA',
      ensDomain: '.eth',
      usesAlternateWallet: false,
      note: null,
    },
    transactionHash: SEED_TRANSACTION_HASH,
    explorerUrl: `${EXPLORER_BASE_URL}/${SEED_TRANSACTION_HASH}`,
    declineReason: null,
    createdAt: '2026-02-24T18:02:00.000Z',
    updatedAt: '2026-02-24T18:02:35.000Z',
  };

  const receipt: ReceiptRecord = {
    orderId: order.id,
    order: structuredClone(order),
    issuedAt: order.updatedAt,
    scenario: DEFAULT_SCENARIO,
  };

  return { orders: [order], receipts: [receipt] };
}
