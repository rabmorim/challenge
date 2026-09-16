import type { UserSpec, WalletSpec } from '@/mocks/types/fixtures';

/**
 * Usuarios semeados.
 *
 * Dois usuarios com dados privados diferentes (favoritos, carteiras, pedidos)
 * — e o que permite provar isolamento: nenhum dado de um aparece na sessao do
 * outro. As credenciais sao ficticias e estao documentadas no README.
 *
 * Os campos do frame do perfil (nome ENS e apelido da carteira) tambem sao
 * diferentes entre os dois de proposito: o teste de isolamento compara valores,
 * e dois usuarios com o mesmo texto passariam mesmo com vazamento.
 */
export const USER_FIXTURES: UserSpec[] = [
  {
    id: 'user-ana',
    username: 'ana.colecionadora',
    email: 'ana@kurio.dev',
    password: 'kurio1234',
    displayName: 'Ana Ribeiro',
    bio: 'Coleciono retratos generativos desde a primeira cunhagem da Kurio.',
    avatarUrl: '/avatars/collector-ana.png',
    ensName: 'ana.eth',
    walletLabel: 'Cofre da Ana',
    createdAt: '2025-11-02T14:12:00.000Z',
    favoriteNftSlugs: ['emerald-ape-042', 'neon-vessel-552'],
  },
  {
    id: 'user-bruno',
    username: 'bruno.mint',
    email: 'bruno@kurio.dev',
    password: 'kurio4321',
    displayName: 'Bruno Salles',
    bio: 'Curador de edicoes curtas e caca-promocoes.',
    avatarUrl: '/avatars/collector-bruno.png',
    ensName: 'bruno.kurio.eth',
    walletLabel: 'Carteira do Bruno',
    createdAt: '2026-01-08T09:45:00.000Z',
    favoriteNftSlugs: ['golden-beat-207'],
  },
];

/**
 * Carteiras semeadas.
 *
 * Ana tem principal e secundaria (uma conectada, outra desconectada) para
 * exercitar a tela de carteiras e os dois cartoes do frame de pagamento de 414;
 * Bruno tem apenas a principal, o que cobre o caso de cadastrar a segunda —
 * inclusive pelo atalho "Igual a carteira principal".
 * Os rotulos ("Principal" e "Reserva") e o nome ENS saem do frame.
 */
export const WALLET_FIXTURES: WalletSpec[] = [
  {
    id: 'wallet-ana-primary',
    userId: 'user-ana',
    label: 'Principal',
    provider: 'metamask',
    role: 'primary',
    // O final do endereco reproduz o `0xA91F...E82C` do frame de 414 depois de
    // mascarado — e o mesmo texto que aparece no recibo.
    address: '0xA91F7c3b0d5e2481a6f09c4b7d3e150f9a26E82C',
    ensName: 'ana.eth',
    network: 'ethereum',
    displayName: 'Ana Ribeiro',
    profileName: 'ana.colecionadora',
    email: 'ana@kurio.dev',
    referralCode: 'KURIO-ANA1',
  },
  {
    id: 'wallet-ana-secondary',
    userId: 'user-ana',
    label: 'Reserva',
    provider: 'walletconnect',
    role: 'secondary',
    address: '0x41d7e93b0c85a2f61e78d3c9b05a4f2687d13c9e',
    ensName: 'nova.kurio.eth',
    network: 'polygon',
    displayName: 'Ana Ribeiro',
    profileName: 'ana.reserva',
    email: 'ana@kurio.dev',
    referralCode: 'KURIO-ANA2',
    linkedReference: 'nova.kurio.eth',
  },
  {
    id: 'wallet-bruno-primary',
    userId: 'user-bruno',
    label: 'Coinbase pessoal',
    provider: 'coinbase',
    role: 'primary',
    address: '0x6b29f8d4c07e13a5924d8b6f0c3a7e15d82946bf',
    ensName: 'bruno.kurio.eth',
    network: 'ethereum',
    displayName: 'Bruno Salles',
    profileName: 'bruno.mint',
    email: 'bruno@kurio.dev',
    referralCode: 'KURIO-BRU1',
  },
];
