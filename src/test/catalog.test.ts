import { describe, expect, it } from 'vitest';

import { addFavorite, fetchFavorites, removeFavorite } from '@/features/catalog/api/favorites-api';
import { fetchNft, listNfts } from '@/features/catalog/api/nfts-api';
import { login } from '@/features/auth/api/auth-api';
import { buildNftFixtures, getNftSeedIdentity } from '@/mocks/fixtures/nfts';
import { selectScenario } from '@/test/mock-control';

/**
 * Catalogo: busca, filtros combinados, ordenacao, paginacao, facetas, detalhe e
 * favoritos. Confere que a resposta reflete os parametros enviados a API.
 */
describe('catalogo', () => {
  it('pagina o catalogo semeado em quatro paginas de nove', async () => {
    const first = await listNfts({});
    expect(first.total).toBe(36);
    expect(first.items).toHaveLength(9);
    expect(first.totalPages).toBe(4);

    const last = await listNfts({ page: 4 });
    expect(last.items).toHaveLength(9);
    expect(last.page).toBe(4);
  });

  it('ordena por preco usando comparacao decimal', async () => {
    const ascending = await listNfts({ sort: 'price-asc', pageSize: 36 });
    const prices = ascending.items.map((item) => item.price);

    expect(prices[0]).toBe('0.02');
    expect(prices.at(-1)).toBe('12.30');
    expect(ascending.appliedSort).toBe('price-asc');
  });

  it('combina busca, filtro de rede e faixa de preco', async () => {
    const response = await listNfts({
      search: 'ape',
      networks: ['ethereum'],
      priceMin: '1',
      priceMax: '3',
      pageSize: 36,
    });

    expect(response.items.length).toBeGreaterThan(0);
    for (const item of response.items) {
      expect(item.name.toLowerCase()).toContain('ape');
      expect(item.network).toBe('ethereum');
      expect(Number(item.price)).toBeGreaterThanOrEqual(1);
      expect(Number(item.price)).toBeLessThanOrEqual(3);
    }
  });

  it('combina filtro de colecao com raridade', async () => {
    const response = await listNfts({
      collections: ['digital-art'],
      rarities: ['legendary'],
      pageSize: 36,
    });

    expect(response.items.length).toBeGreaterThan(0);
    expect(response.items.map((item) => item.slug)).toContain('emerald-ape-360');
    for (const item of response.items) {
      expect(item.collectionId).toBe('digital-art');
      expect(item.rarity).toBe('legendary');
    }
  });

  it('devolve as facetas do frame e a faixa de preco do acervo', async () => {
    const response = await listNfts({});
    const collections = new Map(response.facets.collections.map((facet) => [facet.id, facet.count]));
    const networks = new Map(response.facets.networks.map((facet) => [facet.id, facet.count]));

    // Colecao e rede publicam o tamanho declarado nas fixtures (os numeros do
    // `design/Início.png`); a faixa de preco continua saindo do acervo real.
    expect(response.facets.collections.map((facet) => facet.label)).toEqual([
      'Arte digital',
      'Fotografia',
      'Música',
      'Arte 3D',
      'Colecionáveis',
      'Generativa',
      'Jogos',
      'Assinaturas',
      'Utilidade',
    ]);
    expect(collections.get('digital-art')).toBe(33);
    expect(collections.get('music')).toBe(65);
    expect(networks.get('ethereum')).toBe(119);
    expect(networks.get('polygon')).toBe(78);
    expect(networks.get('solana')).toBe(86);
    expect(response.facets.priceRange).toEqual({ min: '0.02', max: '12.30' });
  });

  it('filtra pela colecao escolhida sobre os itens de verdade', async () => {
    const response = await listNfts({ collections: ['photography'], pageSize: 36 });

    expect(response.total).toBe(3);
    for (const item of response.items) {
      expect(item.collectionId).toBe('photography');
      expect(item.collectionName).toBe('Fotografia');
    }
  });

  it('recorta as abas de novos lancamentos e em alta', async () => {
    const news = await listNfts({ tab: 'new', pageSize: 36 });
    const trending = await listNfts({ tab: 'trending', pageSize: 36 });

    expect(news.total).toBe(8);
    // As duas abas recortam por ranking e depois aplicam a ordenacao pedida
    // (padrao: mais recentes), entao o topo e o item listado por ultimo.
    expect(news.items[0]?.slug).toBe('emerald-ape-042');
    expect(trending.items[0]?.slug).toBe('emerald-ape-042');
    // O recorte em si continua sendo por `trendingScore`: o item de maior peso
    // esta na aba, mesmo nao sendo o primeiro depois da ordenacao.
    expect(trending.items.map((item) => item.slug)).toContain('neon-vessel-552');
    expect(trending.appliedTab).toBe('trending');
  });

  it('devolve resultado vazio para busca sem correspondencia', async () => {
    const response = await listNfts({ search: 'inexistente' });

    expect(response.items).toEqual([]);
    expect(response.total).toBe(0);
    expect(response.totalPages).toBe(1);
  });

  it('serve o detalhe por id e por slug e responde 404 no inexistente', async () => {
    const detail = await fetchNft('emerald-ape-042');

    expect(detail.name).toBe('Emerald Ape #042');
    expect(detail.gallery.length).toBeGreaterThan(0);
    expect(detail.traits.map((trait) => trait.label)).toContain('Raridade');
    expect(detail.edition).toMatchObject({ total: 50, available: 12, maxPerOrder: 3 });

    await expect(fetchNft('nao-existe')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404,
    });
  });

  it('respeita o cenario de catalogo vazio', async () => {
    await selectScenario('empty');
    const response = await listNfts({});

    expect(response.items).toEqual([]);
    expect(response.total).toBe(0);
  });

  it('a assinatura da semeadura reage a colecao e a contagem de avaliacoes', () => {
    // Regressao: mover um item de colecao (ou acertar a contagem de avaliacoes
    // do frame) nao mudava a assinatura, entao um navegador que ja tinha aberto
    // o app continuava restaurando o acervo antigo do `localStorage` — com a
    // colecao de antes em "Mais desta colecao" e a nota de antes no cabecalho.
    const identity = new Map(getNftSeedIdentity().map((row) => [String(row[0]), row]));

    for (const nft of buildNftFixtures()) {
      const row = identity.get(nft.slug);
      expect(row).toBeDefined();
      expect(row).toContain(nft.collectionId);
    }

    expect(identity.get('emerald-ape-042')).toContain(19);
  });

  it('favorita e desfavorita mantendo a contagem coerente', async () => {
    await login({ email: 'bruno@kurio.dev', password: 'kurio4321' });

    const added = await addFavorite('cosmic-bloom-118');
    expect(added).toMatchObject({ nftId: 'cosmic-bloom-118', favorited: true, favoritesCount: 65 });

    const favorites = await fetchFavorites();
    expect(favorites.nftIds).toContain('cosmic-bloom-118');

    const removed = await removeFavorite('cosmic-bloom-118');
    expect(removed).toMatchObject({ favorited: false, favoritesCount: 64 });
  });
});
