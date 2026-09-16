import type { CouponRecord } from '@/mocks/types/db';

/**
 * Cupons semeados — um por caminho de erro exigido pelo README:
 * valido, expirado, restrito a colecao e restrito por subtotal minimo.
 * Qualquer codigo fora desta lista cai em `COUPON_NOT_FOUND`.
 */
export const COUPON_FIXTURES: CouponRecord[] = [
  {
    code: 'KURIO10',
    label: '10% de desconto na primeira compra',
    percentOff: '10',
    expiresAt: null,
    minSubtotal: null,
    collectionIds: null,
  },
  {
    code: 'GENESIS20',
    label: '20% no lancamento genesis',
    percentOff: '20',
    // Data no passado: cobre o caminho "cupom expirado".
    expiresAt: '2026-01-31T23:59:59.000Z',
    minSubtotal: null,
    collectionIds: null,
  },
  {
    code: 'ARTE15',
    label: '15% na colecao Arte digital',
    percentOff: '15',
    expiresAt: null,
    minSubtotal: null,
    // Cobre "cupom nao aplicavel" quando o carrinho nao tem itens da colecao.
    collectionIds: ['digital-art'],
  },
  {
    code: 'WHALE25',
    label: '25% acima de 5 ETH',
    percentOff: '25',
    expiresAt: null,
    // Cobre "cupom nao aplicavel" por subtotal insuficiente.
    minSubtotal: '5',
    collectionIds: null,
  },
];
