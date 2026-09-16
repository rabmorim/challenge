import type { CollectionRecord } from '@/mocks/types/db';
import type { ArtworkKey } from '@/mocks/types/fixtures';

/**
 * Colecoes do catalogo, na ordem em que a sidebar as exibe.
 *
 * Sao as nove categorias do `design/Início.png` — a lista interna da sidebar
 * tem 360px e cada linha 40px, entao nove e exatamente o que fecha a caixa.
 *
 * `catalogSize` e o tamanho do acervo anunciado pela faceta (a contagem entre
 * parenteses no frame). Ele nao e o numero de itens semeados: o frame anuncia
 * 239 itens em colecoes e 283 em redes, dois totais que nenhum acervo unico
 * satisfaz ao mesmo tempo, e ainda desenha uma paginacao de 4 paginas de 9.
 * Sao numeros de vitrine — por isso ficam declarados aqui, na camada de mocks,
 * e nao inventados no cliente. O filtro em si continua operando sobre os itens
 * de verdade.
 */
export const COLLECTION_FIXTURES: CollectionRecord[] = [
  {
    id: 'digital-art',
    name: 'Arte digital',
    description: 'Pinturas e ilustracoes nativas digitais, assinadas pelo criador.',
    catalogSize: 33,
    contractAddress: '0x7a1f4c9e2b8d5063af1e7c4d9b2f6a0e35c81d47',
    background: 'Esmeralda profundo',
  },
  {
    id: 'photography',
    name: 'Fotografia',
    description: 'Retratos e ensaios fotograficos com tiragem numerada.',
    catalogSize: 12,
    contractAddress: '0x9b6e3c81d47a0f2596c8b3e5d7f1a04628c95e3b',
    background: 'Marfim quente',
  },
  {
    id: 'music',
    name: 'Música',
    description: 'Faixas, capas e passes de estudio da cena eletronica.',
    catalogSize: 65,
    contractAddress: '0x2d8c5f9a3e714b06d92f8c1a5b7e30469a2c8d51',
    background: 'Âmbar dourado',
  },
  {
    id: 'art-3d',
    name: 'Arte 3D',
    description: 'Esculturas e cenas renderizadas em edicoes curtas.',
    catalogSize: 39,
    contractAddress: '0xc41b8e5d97a2f0631d4e8c5b7a9f3e06248d1b7c',
    background: 'Neon noturno',
  },
  {
    id: 'collectibles',
    name: 'Colecionáveis',
    description: 'Personagens de serie, o colecionavel classico da Kurio.',
    catalogSize: 23,
    contractAddress: '0x3e9d0b7c14af62d5981e4c7b0a6f2d93855c1e08',
    background: 'Terracota fosco',
  },
  {
    id: 'generative',
    name: 'Generativa',
    description: 'Pecas geradas por algoritmo a partir de ruido cosmico.',
    catalogSize: 17,
    contractAddress: '0x58f2a7d0c39b6e14872d5f0a9c3b7e461d08a259',
    background: 'Nebulosa violeta',
  },
  {
    id: 'gaming',
    name: 'Jogos',
    description: 'Avatares e itens jogaveis de mundos parceiros.',
    catalogSize: 19,
    contractAddress: '0x64a0d7f38b21e5c907d4a6b8f3e15c02947bd6a1',
    background: 'Violeta urbano',
  },
  {
    id: 'memberships',
    name: 'Assinaturas',
    description: 'Passes de acesso a clubes, drops e listas fechadas.',
    catalogSize: 13,
    contractAddress: '0x1f7b95e0c48d2a63817f5b0c9e4d3a26708c5f92',
    background: 'Bronze polido',
  },
  {
    id: 'utility',
    name: 'Utilidade',
    description: 'Itens com funcao dentro do ecossistema — cupons, chaves e badges.',
    catalogSize: 18,
    contractAddress: '0x85c2e40b9d7a13f6248e0c5b9a7f3d1607b4e2c8',
    background: 'Cobre fosco',
  },
];

/**
 * Endereco de contrato simulado por colecao.
 * Ficticio, mas estavel: o recibo e o detalhe exibem sempre o mesmo valor.
 */
export const COLLECTION_CONTRACT_ADDRESSES: Record<string, string> = Object.fromEntries(
  COLLECTION_FIXTURES.map((collection) => [collection.id, collection.contractAddress]),
);

/**
 * Arquivo de cada arte exportada do Figma.
 *
 * Sao quatro pecas para nove NFTs desenhados porque o proprio layout as
 * reutiliza (ver `design/Início.png`). Cada arquivo leva o slug do primeiro
 * NFT que exibe a arte, que e o nome que as fixtures ja esperavam.
 */
export const ARTWORK_FILES: Record<ArtworkKey, string> = {
  'emerald-varsity': '/nfts/emerald-ape-042.png',
  'violet-bucket': '/nfts/sage-nomad-009.png',
  'ivory-blazer': '/nfts/neon-vessel-552.png',
  'golden-headphones': '/nfts/golden-beat-207.png',
};

/** Descricao do fundo da arte, usada como atributo do detalhe. */
export const COLLECTION_BACKGROUNDS: Record<string, string> = Object.fromEntries(
  COLLECTION_FIXTURES.map((collection) => [collection.id, collection.background]),
);
