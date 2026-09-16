import { NETWORKS } from '@/constants/network';
import { RARITY_LABELS } from '@/features/catalog/constants/catalog';
import type { NftTrait } from '@/features/catalog/types/nft';
import {
  ARTWORK_FILES,
  COLLECTION_BACKGROUNDS,
  COLLECTION_CONTRACT_ADDRESSES,
  COLLECTION_FIXTURES,
} from '@/mocks/fixtures/collections';
import { CREATOR_FIXTURES } from '@/mocks/fixtures/creators';
import { buildRating, buildReviews } from '@/mocks/fixtures/reviews';
import type { NftRecord } from '@/mocks/types/db';
import type { NftSpec } from '@/mocks/types/fixtures';

/** Versao inicial de todo NFT semeado — sobe a cada alteracao no servidor. */
const INITIAL_VERSION = 1;

/** Quantidade de imagens na galeria do detalhe — quatro miniaturas no frame. */
const GALLERY_SIZE = 4;

/**
 * Serie editorial que assina todo o acervo, citada nos textos do detalhe.
 * Nao e a colecao do filtro: e a marca que o frame escreve por extenso.
 */
const EDITIONS_LABEL = 'Kurio Editions';

/** Percentual de direitos autorais do criador nas vendas secundarias. */
const ROYALTY_PERCENT = 5;

/**
 * Catálogo semeado: 36 itens.
 *
 * Os nove primeiros são os do layout (nome, preço e promoção iguais aos do
 * Figma) e as datas de listagem estão na ordem em que o `design/Início.png` os
 * exibe — assim a primeira página da ordenação padrão ("Listados recentemente")
 * é exatamente a do frame, o que também dá uma baseline estável à regressão
 * visual. Os demais existem para dar volume à paginação (4 páginas de 9, como no frame) e
 * variedade aos filtros — preços de 0.02 a 12.30 ETH (a faixa que o frame
 * mostra no slider), as três redes, as três raridades e as nove coleções da
 * sidebar. A distribuição não é uniforme: `digital-art` é a coleção que o
 * `design/Detalhes do NFT.png` abre, e o frame mostra ali cinco cards com três
 * bolinhas de paginação — são doze itens, onze relacionados, três páginas de
 * cinco. As outras oito ficam com três cada, e o total segue em 36 para que a
 * Início continue com as 4 páginas de 9 do frame. Casos de borda propositais:
 * `golden-signal-160` está esgotado (0 disponíveis) e `ivory-baron-088` tem
 * uma única unidade, o que permite esgotar a edição durante o checkout.
 */
const NFT_SPECS: NftSpec[] = [
  {
    slug: 'emerald-ape-042',
    name: 'Emerald Ape #042',
    collectionId: 'digital-art',
    creatorId: 'nova-sato',
    network: 'ethereum',
    price: '1.19',
    previousPrice: null,
    rarity: 'rare',
    artwork: 'emerald-varsity',
    editionTotal: 50,
    editionAvailable: 12,
    maxPerOrder: 3,
    listedAt: '2026-02-24T15:00:00.000Z',
    favoritesCount: 128,
    trendingScore: 92,
    // A peca do frame de detalhe: colecao, acessorio e fundo saem do
    // `design/Detalhes do NFT.png` ("Kurio Apes" / "Oculos, Esmeralda, Raro"),
    // que nao usa o rotulo da faceta nem o fundo padrao da colecao.
    accessory: 'Óculos',
    background: 'Esmeralda',
    collectionLabel: 'Kurio Apes',
    reviewCount: 19,
  },
  {
    slug: 'sage-nomad-009',
    name: 'Sage Nomad #009',
    collectionId: 'collectibles',
    creatorId: 'nomad-atelier',
    network: 'polygon',
    price: '1.69',
    previousPrice: null,
    rarity: 'rare',
    artwork: 'violet-bucket',
    editionTotal: 30,
    editionAvailable: 7,
    maxPerOrder: 2,
    listedAt: '2026-02-23T13:30:00.000Z',
    favoritesCount: 96,
    trendingScore: 74,
    accessory: 'Bucket hat',
  },
  {
    slug: 'neon-vessel-552',
    name: 'Neon Vessel #552',
    collectionId: 'art-3d',
    creatorId: 'nova-sato',
    network: 'ethereum',
    price: '1.99',
    previousPrice: '2.29',
    rarity: 'legendary',
    artwork: 'ivory-blazer',
    editionTotal: 12,
    editionAvailable: 3,
    maxPerOrder: 1,
    listedAt: '2026-02-22T18:45:00.000Z',
    favoritesCount: 211,
    trendingScore: 98,
    accessory: 'Gola esmeralda',
  },
  {
    slug: 'cosmic-bloom-118',
    name: 'Cosmic Bloom #118',
    collectionId: 'generative',
    creatorId: 'oficina-aurora',
    network: 'solana',
    price: '1.29',
    previousPrice: null,
    rarity: 'common',
    artwork: 'violet-bucket',
    editionTotal: 100,
    editionAvailable: 44,
    maxPerOrder: 5,
    listedAt: '2026-02-21T09:10:00.000Z',
    favoritesCount: 64,
    trendingScore: 55,
    accessory: 'Moletom violeta',
  },
  {
    slug: 'violet-nomad-314',
    name: 'Violet Nomad #314',
    collectionId: 'gaming',
    creatorId: 'nomad-atelier',
    network: 'ethereum',
    price: '1.39',
    previousPrice: '1.55',
    rarity: 'rare',
    artwork: 'violet-bucket',
    editionTotal: 40,
    editionAvailable: 9,
    maxPerOrder: 3,
    listedAt: '2026-02-20T11:20:00.000Z',
    favoritesCount: 88,
    trendingScore: 61,
    accessory: 'Bucket hat',
  },
  {
    slug: 'ivory-baron-088',
    name: 'Ivory Baron #088',
    collectionId: 'photography',
    creatorId: 'oficina-aurora',
    network: 'polygon',
    price: '1.79',
    previousPrice: null,
    rarity: 'rare',
    artwork: 'ivory-blazer',
    editionTotal: 25,
    editionAvailable: 1,
    maxPerOrder: 1,
    listedAt: '2026-02-19T16:05:00.000Z',
    favoritesCount: 73,
    trendingScore: 47,
    accessory: 'Blazer de marfim',
  },
  {
    slug: 'golden-beat-207',
    name: 'Golden Beat #207',
    collectionId: 'music',
    creatorId: 'nova-sato',
    network: 'ethereum',
    price: '0.99',
    previousPrice: null,
    rarity: 'common',
    artwork: 'golden-headphones',
    editionTotal: 120,
    editionAvailable: 58,
    maxPerOrder: 5,
    listedAt: '2026-02-18T10:00:00.000Z',
    favoritesCount: 51,
    trendingScore: 38,
    accessory: 'Headphones dourados',
  },
  {
    slug: 'golden-signal-160',
    name: 'Golden Signal #160',
    collectionId: 'music',
    creatorId: 'nova-sato',
    network: 'solana',
    price: '0.39',
    previousPrice: '0.49',
    rarity: 'common',
    artwork: 'golden-headphones',
    editionTotal: 200,
    editionAvailable: 0,
    maxPerOrder: 5,
    listedAt: '2026-02-16T14:40:00.000Z',
    favoritesCount: 34,
    trendingScore: 21,
    accessory: 'Headphones dourados',
  },
  {
    slug: 'golden-frequency-071',
    name: 'Golden Frequency #071',
    collectionId: 'music',
    creatorId: 'oficina-aurora',
    network: 'polygon',
    price: '0.59',
    previousPrice: null,
    rarity: 'common',
    artwork: 'golden-headphones',
    editionTotal: 150,
    editionAvailable: 97,
    maxPerOrder: 5,
    listedAt: '2026-02-17T08:25:00.000Z',
    favoritesCount: 29,
    trendingScore: 18,
    accessory: 'Headphones dourados',
  },
  {
    slug: 'emerald-ape-101',
    name: 'Emerald Ape #101',
    collectionId: 'digital-art',
    creatorId: 'nova-sato',
    network: 'ethereum',
    price: '2.45',
    previousPrice: null,
    rarity: 'rare',
    artwork: 'golden-headphones',
    editionTotal: 50,
    editionAvailable: 20,
    maxPerOrder: 3,
    listedAt: '2026-01-30T12:00:00.000Z',
    favoritesCount: 77,
    trendingScore: 65,
    accessory: 'Headphones dourados',
  },
  {
    slug: 'emerald-ape-233',
    name: 'Emerald Ape #233',
    collectionId: 'digital-art',
    creatorId: 'nomad-atelier',
    network: 'polygon',
    price: '0.89',
    previousPrice: '1.10',
    rarity: 'common',
    artwork: 'violet-bucket',
    editionTotal: 80,
    editionAvailable: 33,
    maxPerOrder: 4,
    listedAt: '2026-01-28T12:00:00.000Z',
    favoritesCount: 42,
    trendingScore: 30,
    accessory: 'Bucket hat',
  },
  {
    slug: 'emerald-ape-360',
    name: 'Emerald Ape #360',
    collectionId: 'digital-art',
    creatorId: 'nova-sato',
    network: 'solana',
    price: '3.20',
    previousPrice: null,
    rarity: 'legendary',
    artwork: 'ivory-blazer',
    editionTotal: 10,
    editionAvailable: 2,
    maxPerOrder: 1,
    listedAt: '2026-01-26T12:00:00.000Z',
    favoritesCount: 190,
    trendingScore: 88,
    accessory: 'Gola esmeralda',
  },
  {
    slug: 'sage-nomad-045',
    name: 'Sage Nomad #045',
    collectionId: 'collectibles',
    creatorId: 'nomad-atelier',
    network: 'ethereum',
    price: '1.05',
    previousPrice: null,
    rarity: 'common',
    artwork: 'ivory-blazer',
    editionTotal: 90,
    editionAvailable: 41,
    maxPerOrder: 4,
    listedAt: '2026-01-24T12:00:00.000Z',
    favoritesCount: 39,
    trendingScore: 27,
    accessory: 'Blazer de marfim',
  },
  {
    slug: 'sage-nomad-128',
    name: 'Sage Nomad #128',
    collectionId: 'collectibles',
    creatorId: 'oficina-aurora',
    network: 'solana',
    price: '0.75',
    previousPrice: '0.95',
    rarity: 'common',
    artwork: 'golden-headphones',
    editionTotal: 110,
    editionAvailable: 63,
    maxPerOrder: 5,
    listedAt: '2026-01-22T12:00:00.000Z',
    favoritesCount: 31,
    trendingScore: 22,
    accessory: 'Headphones dourados',
  },
  {
    slug: 'violet-nomad-402',
    name: 'Violet Nomad #402',
    collectionId: 'gaming',
    creatorId: 'nomad-atelier',
    network: 'polygon',
    price: '2.10',
    previousPrice: null,
    rarity: 'rare',
    artwork: 'emerald-varsity',
    editionTotal: 35,
    editionAvailable: 11,
    maxPerOrder: 2,
    listedAt: '2026-01-20T12:00:00.000Z',
    favoritesCount: 84,
    trendingScore: 58,
    accessory: 'Jaqueta esmeralda',
  },
  {
    slug: 'neon-vessel-118',
    name: 'Neon Vessel #118',
    collectionId: 'art-3d',
    creatorId: 'nova-sato',
    network: 'ethereum',
    price: '12.30',
    previousPrice: null,
    rarity: 'legendary',
    artwork: 'emerald-varsity',
    editionTotal: 8,
    editionAvailable: 1,
    maxPerOrder: 1,
    listedAt: '2026-01-18T12:00:00.000Z',
    favoritesCount: 240,
    trendingScore: 95,
    accessory: 'Óculos espelhados',
  },
  {
    slug: 'neon-vessel-777',
    name: 'Neon Vessel #777',
    collectionId: 'art-3d',
    creatorId: 'oficina-aurora',
    network: 'polygon',
    price: '1.45',
    previousPrice: '1.75',
    rarity: 'rare',
    artwork: 'golden-headphones',
    editionTotal: 45,
    editionAvailable: 16,
    maxPerOrder: 3,
    listedAt: '2026-01-16T12:00:00.000Z',
    favoritesCount: 68,
    trendingScore: 52,
    accessory: 'Headphones dourados',
  },
  {
    slug: 'cosmic-bloom-256',
    name: 'Cosmic Bloom #256',
    collectionId: 'generative',
    creatorId: 'oficina-aurora',
    network: 'ethereum',
    price: '0.02',
    previousPrice: null,
    rarity: 'common',
    artwork: 'ivory-blazer',
    editionTotal: 300,
    editionAvailable: 187,
    maxPerOrder: 5,
    listedAt: '2026-01-14T12:00:00.000Z',
    favoritesCount: 22,
    trendingScore: 12,
    accessory: 'Blazer de marfim',
  },
  {
    slug: 'cosmic-bloom-390',
    name: 'Cosmic Bloom #390',
    collectionId: 'generative',
    creatorId: 'nova-sato',
    network: 'solana',
    price: '2.80',
    previousPrice: null,
    rarity: 'legendary',
    artwork: 'emerald-varsity',
    editionTotal: 15,
    editionAvailable: 4,
    maxPerOrder: 2,
    listedAt: '2026-01-12T12:00:00.000Z',
    favoritesCount: 152,
    trendingScore: 81,
    accessory: 'Corrente de ouro',
  },
  {
    slug: 'ivory-baron-155',
    name: 'Ivory Baron #155',
    collectionId: 'photography',
    creatorId: 'oficina-aurora',
    network: 'ethereum',
    price: '1.60',
    previousPrice: null,
    rarity: 'rare',
    artwork: 'emerald-varsity',
    editionTotal: 28,
    editionAvailable: 6,
    maxPerOrder: 2,
    listedAt: '2026-01-10T12:00:00.000Z',
    favoritesCount: 59,
    trendingScore: 44,
    accessory: 'Jaqueta esmeralda',
  },
  {
    slug: 'ivory-baron-311',
    name: 'Ivory Baron #311',
    collectionId: 'photography',
    creatorId: 'nomad-atelier',
    network: 'solana',
    price: '0.65',
    previousPrice: '0.80',
    rarity: 'common',
    artwork: 'violet-bucket',
    editionTotal: 130,
    editionAvailable: 72,
    maxPerOrder: 5,
    listedAt: '2026-01-08T12:00:00.000Z',
    favoritesCount: 27,
    trendingScore: 16,
    accessory: 'Moletom violeta',
  },
  {
    slug: 'golden-beat-418',
    name: 'Golden Beat #418',
    collectionId: 'digital-art',
    creatorId: 'nova-sato',
    network: 'polygon',
    price: '0.29',
    previousPrice: null,
    rarity: 'common',
    artwork: 'emerald-varsity',
    editionTotal: 250,
    editionAvailable: 144,
    maxPerOrder: 5,
    listedAt: '2026-01-06T12:00:00.000Z',
    favoritesCount: 19,
    trendingScore: 9,
    accessory: 'Corrente de ouro',
  },
  {
    slug: 'golden-signal-505',
    name: 'Golden Signal #505',
    collectionId: 'memberships',
    creatorId: 'oficina-aurora',
    network: 'ethereum',
    price: '3.75',
    previousPrice: null,
    rarity: 'legendary',
    artwork: 'ivory-blazer',
    editionTotal: 9,
    editionAvailable: 2,
    maxPerOrder: 1,
    listedAt: '2026-01-04T12:00:00.000Z',
    favoritesCount: 205,
    trendingScore: 90,
    accessory: 'Gola esmeralda',
  },
  {
    slug: 'golden-frequency-612',
    name: 'Golden Frequency #612',
    collectionId: 'memberships',
    creatorId: 'nomad-atelier',
    network: 'polygon',
    price: '1.15',
    previousPrice: null,
    rarity: 'common',
    artwork: 'violet-bucket',
    editionTotal: 95,
    editionAvailable: 48,
    maxPerOrder: 4,
    listedAt: '2026-01-02T12:00:00.000Z',
    favoritesCount: 36,
    trendingScore: 25,
    accessory: 'Bucket hat',
  },
  {
    slug: 'sage-nomad-221',
    name: 'Sage Nomad #221',
    collectionId: 'digital-art',
    creatorId: 'nomad-atelier',
    network: 'ethereum',
    price: '2.65',
    previousPrice: null,
    rarity: 'legendary',
    artwork: 'violet-bucket',
    editionTotal: 14,
    editionAvailable: 4,
    maxPerOrder: 1,
    listedAt: '2025-12-30T12:00:00.000Z',
    favoritesCount: 88,
    trendingScore: 14,
    accessory: 'Bucket hat',
  },
  {
    slug: 'violet-nomad-497',
    name: 'Violet Nomad #497',
    collectionId: 'gaming',
    creatorId: 'nova-sato',
    network: 'polygon',
    price: '0.82',
    previousPrice: '0.95',
    rarity: 'common',
    artwork: 'violet-bucket',
    editionTotal: 180,
    editionAvailable: 96,
    maxPerOrder: 5,
    listedAt: '2025-12-28T12:00:00.000Z',
    favoritesCount: 31,
    trendingScore: 13,
    accessory: 'Moletom violeta',
  },
  {
    slug: 'sage-nomad-733',
    name: 'Sage Nomad #733',
    collectionId: 'digital-art',
    creatorId: 'oficina-aurora',
    network: 'solana',
    price: '1.25',
    previousPrice: null,
    rarity: 'rare',
    artwork: 'emerald-varsity',
    editionTotal: 42,
    editionAvailable: 18,
    maxPerOrder: 3,
    listedAt: '2025-12-26T12:00:00.000Z',
    favoritesCount: 54,
    trendingScore: 11,
    accessory: 'Jaqueta esmeralda',
  },
  {
    slug: 'neon-vessel-184',
    name: 'Neon Vessel #184',
    collectionId: 'digital-art',
    creatorId: 'nova-sato',
    network: 'ethereum',
    price: '2.05',
    previousPrice: null,
    rarity: 'rare',
    artwork: 'ivory-blazer',
    editionTotal: 36,
    editionAvailable: 11,
    maxPerOrder: 2,
    listedAt: '2025-12-24T12:00:00.000Z',
    favoritesCount: 63,
    trendingScore: 10,
    accessory: 'Blazer marfim',
  },
  {
    slug: 'neon-vessel-640',
    name: 'Neon Vessel #640',
    collectionId: 'utility',
    creatorId: 'nomad-atelier',
    network: 'solana',
    price: '0.45',
    previousPrice: '0.52',
    rarity: 'common',
    artwork: 'golden-headphones',
    editionTotal: 210,
    editionAvailable: 118,
    maxPerOrder: 5,
    listedAt: '2025-12-22T12:00:00.000Z',
    favoritesCount: 24,
    trendingScore: 8,
    accessory: 'Headphones verdes',
  },
  {
    slug: 'neon-vessel-905',
    name: 'Neon Vessel #905',
    collectionId: 'utility',
    creatorId: 'oficina-aurora',
    network: 'polygon',
    price: '1.52',
    previousPrice: null,
    rarity: 'rare',
    artwork: 'ivory-blazer',
    editionTotal: 30,
    editionAvailable: 9,
    maxPerOrder: 2,
    listedAt: '2025-12-20T12:00:00.000Z',
    favoritesCount: 47,
    trendingScore: 7,
    accessory: 'Gola esmeralda',
  },
  {
    slug: 'cosmic-bloom-266',
    name: 'Cosmic Bloom #266',
    collectionId: 'digital-art',
    creatorId: 'oficina-aurora',
    network: 'ethereum',
    price: '0.95',
    previousPrice: null,
    rarity: 'common',
    artwork: 'violet-bucket',
    editionTotal: 160,
    editionAvailable: 84,
    maxPerOrder: 4,
    listedAt: '2025-12-18T12:00:00.000Z',
    favoritesCount: 29,
    trendingScore: 6,
    accessory: 'Bucket hat',
  },
  {
    slug: 'cosmic-bloom-512',
    name: 'Cosmic Bloom #512',
    collectionId: 'utility',
    creatorId: 'nova-sato',
    network: 'polygon',
    price: '1.08',
    previousPrice: '1.30',
    rarity: 'rare',
    artwork: 'emerald-varsity',
    editionTotal: 48,
    editionAvailable: 21,
    maxPerOrder: 3,
    listedAt: '2025-12-16T12:00:00.000Z',
    favoritesCount: 41,
    trendingScore: 5,
    accessory: 'Oculos escuros',
  },
  {
    slug: 'cosmic-bloom-847',
    name: 'Cosmic Bloom #847',
    collectionId: 'digital-art',
    creatorId: 'nomad-atelier',
    network: 'solana',
    price: '0.34',
    previousPrice: null,
    rarity: 'common',
    artwork: 'golden-headphones',
    editionTotal: 240,
    editionAvailable: 152,
    maxPerOrder: 5,
    listedAt: '2025-12-14T12:00:00.000Z',
    favoritesCount: 17,
    trendingScore: 4,
    accessory: 'Jaqueta creme',
  },
  {
    slug: 'ivory-baron-129',
    name: 'Ivory Baron #129',
    collectionId: 'digital-art',
    creatorId: 'nomad-atelier',
    network: 'ethereum',
    price: '0.68',
    previousPrice: null,
    rarity: 'common',
    artwork: 'ivory-blazer',
    editionTotal: 140,
    editionAvailable: 77,
    maxPerOrder: 5,
    listedAt: '2025-12-12T12:00:00.000Z',
    favoritesCount: 22,
    trendingScore: 3,
    accessory: 'Blazer marfim',
  },
  {
    slug: 'ivory-baron-458',
    name: 'Ivory Baron #458',
    collectionId: 'memberships',
    creatorId: 'nova-sato',
    network: 'solana',
    price: '0.22',
    previousPrice: null,
    rarity: 'common',
    artwork: 'golden-headphones',
    editionTotal: 300,
    editionAvailable: 198,
    maxPerOrder: 5,
    listedAt: '2025-12-10T12:00:00.000Z',
    favoritesCount: 13,
    trendingScore: 2,
    accessory: 'Headphones verdes',
  },
  {
    slug: 'ivory-baron-902',
    name: 'Ivory Baron #902',
    collectionId: 'digital-art',
    creatorId: 'oficina-aurora',
    network: 'polygon',
    price: '2.45',
    previousPrice: '2.90',
    rarity: 'legendary',
    artwork: 'emerald-varsity',
    editionTotal: 11,
    editionAvailable: 3,
    maxPerOrder: 1,
    listedAt: '2025-12-08T12:00:00.000Z',
    favoritesCount: 96,
    trendingScore: 1,
    accessory: 'Pingente de esmeralda',
  },
];

/**
 * Monta a galeria do detalhe, so com a arte da propria peca.
 *
 * @param spec - Especificacao do NFT.
 * @returns Caminhos de imagem, um por miniatura do frame.
 */
function buildGallery(spec: NftSpec): string[] {
  // A galeria e sempre da MESMA peca — sao enquadramentos da arte do item, nao
  // itens irmaos da colecao. O acervo simulado tem um arquivo por arte, entao
  // os enquadramentos apontam para o mesmo arquivo e se distinguem pelo
  // fragmento: a URL fica unica (o React tem chave estavel) sem que o navegador
  // baixe a imagem de novo, porque o fragmento nao viaja ate o servidor nem
  // entra na chave de cache. A primeira posicao fica sem fragmento para
  // continuar identica a `imageUrl`.
  const file = ARTWORK_FILES[spec.artwork];
  return Array.from({ length: GALLERY_SIZE }, (_unused, index) =>
    index === 0 ? file : `${file}#frame-${String(index + 1)}`,
  );
}

/**
 * Monta o texto curto de "Sobre este NFT".
 *
 * @param network - Nome da rede onde a peca foi cunhada.
 * @returns Resumo exibido logo abaixo do preco.
 */
function buildSummary(network: string): string {
  return `Um colecionável digital finalizado à mão da coleção ${EDITIONS_LABEL}, verificado na ${network}, com arte desbloqueável e acesso para colecionadores.`;
}

/**
 * Monta o texto longo da aba "Detalhes do NFT", em dois paragrafos.
 *
 * @param spec - Especificacao do NFT.
 * @param network - Nome da rede onde a peca foi cunhada.
 * @param creatorName - Nome do criador que recebe os direitos autorais.
 * @returns Paragrafos separados por linha em branco.
 */
function buildStory(spec: NftSpec, network: string, creatorName: string): string {
  return [
    `${spec.name} é uma obra digital 1/${String(spec.editionTotal)} finalizada à mão da coleção ${EDITIONS_LABEL}. Cada atributo fica armazenado nos metadados do token e verificado na ${network}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.`,
    `A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. ${creatorName} recebe ${String(ROYALTY_PERCENT)}% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.`,
  ].join('\n\n');
}

/**
 * Monta os atributos exibidos no detalhe.
 * Todos derivam de dados reais do recurso — a interface nao inventa nenhum.
 *
 * @param spec - Especificacao do NFT.
 * @param collectionName - Nome da colecao ja resolvido.
 * @returns Atributos rotulados em português.
 */
function buildTraits(spec: NftSpec, collectionName: string): NftTrait[] {
  // Os três primeiros são os que distinguem a peça — e são os que a linha
  // "Atributos" do resumo exibe. Coleção, rede e edição vêm depois porque já
  // têm linha própria no detalhe.
  return [
    { label: 'Acessório', value: spec.accessory },
    {
      label: 'Fundo',
      value: spec.background ?? COLLECTION_BACKGROUNDS[spec.collectionId] ?? 'Neutro',
    },
    { label: 'Raridade', value: RARITY_LABELS[spec.rarity] },
    { label: 'Coleção', value: collectionName },
    { label: 'Rede', value: NETWORKS[spec.network].label },
    { label: 'Edição', value: `${String(spec.editionTotal)} unidades` },
  ];
}

/**
 * Identidade do acervo semeado: quais itens existem, com que arte e em que
 * edicao. Alimenta a assinatura da semeadura (`getSeedSignature`).
 *
 * Le as especificacoes direto, sem montar as fixtures: o valor e calculado em
 * todo carregamento de pagina, e pagar a semeadura inteira so para tirar um
 * hash acrescentaria latencia visivel ao primeiro render.
 *
 * O caminho do arquivo entra resolvido de proposito — renomear uma arte sem
 * mexer nas especificacoes tambem precisa invalidar o estado persistido.
 *
 * A colecao e a contagem de avaliacoes entram pelo mesmo motivo: mudar a que
 * colecao um item pertence muda quem aparece em "Mais desta colecao" e nos
 * chips de edicao, e um navegador com o estado antigo continuaria mostrando o
 * acervo de antes sem que nada mais na tupla tivesse mudado.
 *
 * @returns Tuplas estaveis que mudam sempre que o acervo muda.
 */
export function getNftSeedIdentity(): (string | number)[][] {
  return NFT_SPECS.map((spec) => [
    spec.slug,
    ARTWORK_FILES[spec.artwork],
    spec.price,
    spec.editionTotal,
    spec.collectionId,
    spec.reviewCount ?? 0,
  ]);
}

/**
 * Converte as especificacoes compactas em registros completos do store.
 *
 * Descricao, galeria, atributos, contrato e `tokenId` sao derivados da
 * especificacao para manter os 24 itens consistentes entre si — acrescentar um
 * item novo exige apenas a especificacao.
 *
 * @returns Catalogo pronto para semear o store.
 * @throws {Error} Quando uma especificacao aponta para colecao ou criador inexistente.
 */
export function buildNftFixtures(): NftRecord[] {
  const collectionsById = new Map(
    COLLECTION_FIXTURES.map((collection) => [collection.id, collection] as const),
  );

  return NFT_SPECS.map((spec) => {
    const collection = collectionsById.get(spec.collectionId);
    if (!collection) {
      throw new Error(`Fixture inconsistente: colecao "${spec.collectionId}" nao existe.`);
    }

    const creator = CREATOR_FIXTURES[spec.creatorId];
    if (!creator) {
      throw new Error(`Fixture inconsistente: criador "${spec.creatorId}" nao existe.`);
    }

    const reviews = buildReviews(spec.slug);
    const network = NETWORKS[spec.network].label;
    const collectionName = spec.collectionLabel ?? collection.name;

    return {
      id: spec.slug,
      version: INITIAL_VERSION,
      slug: spec.slug,
      name: spec.name,
      collectionId: collection.id,
      collectionName,
      creator,
      network: spec.network,
      price: spec.price,
      previousPrice: spec.previousPrice,
      rarity: spec.rarity,
      imageUrl: ARTWORK_FILES[spec.artwork],
      imageAlt: `Arte do NFT ${spec.name}, da coleção ${collectionName}`,
      edition: {
        total: spec.editionTotal,
        available: spec.editionAvailable,
        maxPerOrder: spec.maxPerOrder,
      },
      listedAt: spec.listedAt,
      favoritesCount: spec.favoritesCount,
      description: buildSummary(network),
      story: buildStory(spec, network, creator.name),
      gallery: buildGallery(spec),
      traits: buildTraits(spec, collectionName),
      contractAddress: COLLECTION_CONTRACT_ADDRESSES[spec.collectionId] ?? '0x0',
      tokenId: spec.name.split('#')[1] ?? spec.slug,
      rating: buildRating(spec.slug, reviews, spec.reviewCount),
      reviews,
      trendingScore: spec.trendingScore,
    } satisfies NftRecord;
  });
}
