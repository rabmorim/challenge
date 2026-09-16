import { hashPassword } from '@/mocks/db/password';
import { fingerprint } from '@/mocks/lib/hash';
import { COLLECTION_FIXTURES } from '@/mocks/fixtures/collections';
import { COUPON_FIXTURES } from '@/mocks/fixtures/coupons';
import { buildNftFixtures, getNftSeedIdentity } from '@/mocks/fixtures/nfts';
import { SEED_ORDER_SEQUENCE, buildSeedOrders } from '@/mocks/fixtures/orders';
import { USER_FIXTURES, WALLET_FIXTURES } from '@/mocks/fixtures/users';
import type {
  FavoriteRecord,
  MockDatabase,
  UserRecord,
  WalletRecord,
} from '@/mocks/types/db';

/**
 * Momento usado nas relacoes derivadas da semeadura (favoritos, carteiras).
 * Fixo para que a semeadura seja identica em qualquer execucao.
 */
const SEED_TIMESTAMP = '2026-02-24T10:00:00.000Z';

/** Nomes dos contadores sequenciais do store. */
export const SEQUENCE_NAMES = {
  order: 'order',
  cartItem: 'cart-item',
  quote: 'quote',
  session: 'session',
  wallet: 'wallet',
  user: 'user',
  event: 'event',
} as const;

/** Assinatura das fixtures correntes; calculada uma vez por carregamento. */
let seedSignature: string | null = null;

/**
 * Impressao digital do conteudo semeado.
 *
 * O estado da simulacao e espelhado no `localStorage` para sobreviver ao
 * refresh — mas o navegador nao sabe que as fixtures mudaram e continuaria
 * restaurando um catalogo velho (imagens renomeadas viram 404, itens novos nao
 * aparecem, a paginacao trava no total antigo). Esta assinatura entra no
 * envelope persistido: quando ela nao bate, o estado salvo e descartado e a
 * semeadura refaz tudo, sem ninguem precisar limpar storage na mao.
 *
 * Entram so os campos que identificam o acervo (nao o estado mutavel, que e
 * justamente o que a persistencia existe para preservar).
 *
 * @returns Hash estavel das fixtures.
 */
export function getSeedSignature(): string {
  seedSignature ??= fingerprint({
    collections: COLLECTION_FIXTURES.map((collection) => collection.id),
    coupons: COUPON_FIXTURES.map((coupon) => coupon.code),
    nfts: getNftSeedIdentity(),
    users: USER_FIXTURES.map((user) => [user.id, user.email]),
    wallets: WALLET_FIXTURES.map((wallet) => wallet.id),
  });

  return seedSignature;
}

/**
 * Monta um estado completo e determinístico do servidor simulado.
 *
 * Toda chamada devolve objetos novos (nada e compartilhado com a chamada
 * anterior), o que e o que faz o `reset` restaurar integralmente o cenario
 * conhecido — inclusive depois de mutations.
 *
 * @returns Estado inicial do store.
 * @throws {Error} Quando uma fixture referencia um NFT que nao existe.
 */
export function createSeededDatabase(): MockDatabase {
  const nfts = buildNftFixtures();
  const nftIdsBySlug = new Map(nfts.map((nft) => [nft.slug, nft.id] as const));

  const users: UserRecord[] = USER_FIXTURES.map((spec) => ({
    id: spec.id,
    username: spec.username,
    email: spec.email,
    passwordHash: hashPassword(spec.password),
    displayName: spec.displayName,
    bio: spec.bio,
    ensName: spec.ensName ?? null,
    walletLabel: spec.walletLabel,
    avatarUrl: spec.avatarUrl,
    createdAt: spec.createdAt,
  }));

  const favorites: FavoriteRecord[] = USER_FIXTURES.flatMap((spec) =>
    spec.favoriteNftSlugs.map((slug) => {
      const nftId = nftIdsBySlug.get(slug);
      if (!nftId) {
        throw new Error(`Fixture inconsistente: favorito aponta para "${slug}", que nao existe.`);
      }
      return { userId: spec.id, nftId, createdAt: SEED_TIMESTAMP } satisfies FavoriteRecord;
    }),
  );

  const wallets: WalletRecord[] = WALLET_FIXTURES.map((spec) => ({
    id: spec.id,
    userId: spec.userId,
    label: spec.label,
    provider: spec.provider,
    role: spec.role,
    address: spec.address,
    ensName: spec.ensName ?? null,
    network: spec.network,
    displayName: spec.displayName,
    profileName: spec.profileName,
    email: spec.email,
    referralCode: spec.referralCode,
    linkedReference: spec.linkedReference ?? null,
    // A principal nasce conectada; a secundaria desconectada, para a tela de
    // carteiras ter os dois estados sem depender de uma acao previa.
    status: spec.role === 'primary' ? 'connected' : 'disconnected',
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  }));

  const { orders, receipts } = buildSeedOrders(nfts);

  return {
    users,
    sessions: [],
    collections: structuredClone(COLLECTION_FIXTURES),
    nfts,
    carts: [],
    favorites,
    coupons: structuredClone(COUPON_FIXTURES),
    quotes: [],
    orders,
    receipts,
    idempotency: [],
    wallets,
    sequences: {
      [SEQUENCE_NAMES.order]: SEED_ORDER_SEQUENCE,
      [SEQUENCE_NAMES.cartItem]: 0,
      [SEQUENCE_NAMES.quote]: 0,
      [SEQUENCE_NAMES.session]: 0,
      [SEQUENCE_NAMES.wallet]: WALLET_FIXTURES.length,
      [SEQUENCE_NAMES.user]: USER_FIXTURES.length,
      [SEQUENCE_NAMES.event]: 0,
    },
  };
}
