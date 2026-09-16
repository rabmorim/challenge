import { NETWORKS, isNetworkId } from '@/constants/network';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT,
  DEFAULT_TAB,
  FIRST_PAGE,
  MAX_PAGE_SIZE,
  RARITY_IDS,
  RARITY_LABELS,
} from '@/features/catalog/constants/catalog';
import type {
  NftFacetOption,
  NftListFacets,
  NftListParams,
  NftListResponse,
  NftSortOption,
  NftTab,
} from '@/features/catalog/types/catalog-query';
import type { NftDetail, NftRarity, NftSummary } from '@/features/catalog/types/nft';
import { compareEth } from '@/lib/eth';
import { NEW_RELEASES_LIMIT, TRENDING_LIMIT } from '@/mocks/constants';
import { NETWORK_CATALOG_SIZES } from '@/mocks/fixtures/networks';
import type { MockDatabase, NftRecord } from '@/mocks/types/db';

/**
 * Consulta do catalogo no servidor simulado: busca, filtros combinaveis,
 * ordenacao, abas, paginacao e as contagens que alimentam a sidebar.
 *
 * Vive aqui (e nao no handler) porque e regra do servidor simulado: o handler
 * apenas traduz a URL em parametros e devolve o resultado.
 */

/** Ordenacoes aceitas — usado para validar o que chega na URL. */
const SORT_OPTIONS = new Set<string>(['recent', 'price-asc', 'price-desc', 'name-asc', 'popular']);

/** Abas aceitas. */
const TABS = new Set<string>(['all', 'new', 'trending']);

/**
 * Type guard de ordenacao.
 *
 * @param value - Valor vindo da URL.
 * @returns `true` quando o valor e uma ordenacao conhecida.
 */
function isSortOption(value: string | null): value is NftSortOption {
  return value !== null && SORT_OPTIONS.has(value);
}

/**
 * Type guard de aba.
 *
 * @param value - Valor vindo da URL.
 * @returns `true` quando o valor e uma aba conhecida.
 */
function isTab(value: string | null): value is NftTab {
  return value !== null && TABS.has(value);
}

/** Raridades aceitas, em conjunto, para validar o que chega na URL. */
const RARITY_ID_SET = new Set<string>(RARITY_IDS);

/**
 * Type guard de raridade, para filtrar o que chega da URL.
 *
 * @param value - Valor de origem desconhecida.
 * @returns `true` quando o valor e uma raridade conhecida.
 */
function isRarity(value: string): value is NftRarity {
  return RARITY_ID_SET.has(value);
}

/**
 * Le uma lista de valores repetidos da query string, aceitando tambem valores
 * separados por virgula (`?networks=ethereum,polygon`).
 *
 * @param params - Query string da requisicao.
 * @param key - Nome do parametro.
 * @returns Valores encontrados, sem vazios.
 */
function readList(params: URLSearchParams, key: string): string[] {
  return params
    .getAll(key)
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

/**
 * Le um inteiro positivo da query string.
 *
 * @param params - Query string da requisicao.
 * @param key - Nome do parametro.
 * @returns Inteiro valido ou `undefined`.
 */
function readPositiveInt(params: URLSearchParams, key: string): number | undefined {
  const raw = params.get(key);
  if (raw === null) return undefined;

  const parsed = Number.parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

/**
 * Le um valor decimal em ETH da query string.
 *
 * @param params - Query string da requisicao.
 * @param key - Nome do parametro.
 * @returns String decimal valida ou `undefined`.
 */
function readEthAmount(params: URLSearchParams, key: string): string | undefined {
  const raw = params.get(key)?.trim();
  if (!raw) return undefined;
  return Number.isFinite(Number(raw)) ? raw : undefined;
}

/**
 * Traduz a query string da requisicao nos parametros do contrato.
 * Valores invalidos sao ignorados (o servidor nunca quebra por causa da URL) e
 * a resposta informa o que foi efetivamente aplicado.
 *
 * @param url - URL da requisicao interceptada.
 * @returns Parametros de listagem.
 */
export function parseNftListParams(url: URL): NftListParams {
  const params = url.searchParams;

  const sort = params.get('sort');
  const tab = params.get('tab');
  const search = params.get('search')?.trim();
  const priceMin = readEthAmount(params, 'priceMin');
  const priceMax = readEthAmount(params, 'priceMax');
  const page = readPositiveInt(params, 'page');
  const pageSize = readPositiveInt(params, 'pageSize');

  const collections = readList(params, 'collections');
  const networks = readList(params, 'networks').filter(isNetworkId);
  const rarities = readList(params, 'rarities').filter(isRarity);

  return {
    ...(search ? { search } : {}),
    ...(collections.length > 0 ? { collections } : {}),
    ...(networks.length > 0 ? { networks } : {}),
    ...(rarities.length > 0 ? { rarities } : {}),
    ...(priceMin ? { priceMin } : {}),
    ...(priceMax ? { priceMax } : {}),
    tab: isTab(tab) ? tab : DEFAULT_TAB,
    sort: isSortOption(sort) ? sort : DEFAULT_SORT,
    page: page ?? FIRST_PAGE,
    pageSize: Math.min(pageSize ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
  };
}

/**
 * Converte o registro do store na forma resumida do contrato.
 * Detalhe (descricao, galeria, atributos) e `trendingScore` nao vazam para a
 * listagem — o contrato do card e menor de proposito.
 *
 * @param nft - Registro do store.
 * @returns Resumo publicado pela API.
 */
export function toNftSummary(nft: NftRecord): NftSummary {
  return {
    id: nft.id,
    version: nft.version,
    slug: nft.slug,
    name: nft.name,
    collectionId: nft.collectionId,
    collectionName: nft.collectionName,
    creator: nft.creator,
    network: nft.network,
    price: nft.price,
    previousPrice: nft.previousPrice,
    rarity: nft.rarity,
    imageUrl: nft.imageUrl,
    imageAlt: nft.imageAlt,
    edition: { ...nft.edition },
    listedAt: nft.listedAt,
    favoritesCount: nft.favoritesCount,
  };
}

/**
 * Aplica o recorte da aba ativa.
 *
 * As abas usam ranking (mais recentes / maior `trendingScore`) em vez de janela
 * de tempo: assim o resultado nao depende do relogio da maquina e os testes
 * continuam determinísticos.
 *
 * @param nfts - Catalogo completo.
 * @param tab - Aba ativa.
 * @returns Subconjunto correspondente a aba.
 */
function applyTab(nfts: NftRecord[], tab: NftTab): NftRecord[] {
  if (tab === 'new') {
    return nfts
      .toSorted((left, right) => Date.parse(right.listedAt) - Date.parse(left.listedAt))
      .slice(0, NEW_RELEASES_LIMIT);
  }

  if (tab === 'trending') {
    return nfts
      .toSorted((left, right) => right.trendingScore - left.trendingScore)
      .slice(0, TRENDING_LIMIT);
  }

  return [...nfts];
}

/**
 * Aplica a busca livre por nome, colecao e criador.
 *
 * @param nfts - Itens candidatos.
 * @param search - Termo digitado.
 * @returns Itens que casam com o termo.
 */
function applySearch(nfts: NftRecord[], search: string | undefined): NftRecord[] {
  if (!search) return nfts;

  const term = search.toLowerCase();
  return nfts.filter((nft) =>
    [nft.name, nft.collectionName, nft.creator.name].some((field) =>
      field.toLowerCase().includes(term),
    ),
  );
}

/**
 * Aplica os filtros combinaveis da sidebar.
 *
 * @param nfts - Itens candidatos.
 * @param params - Parametros da listagem.
 * @returns Itens que passam por todos os filtros informados.
 */
function applyFilters(nfts: NftRecord[], params: NftListParams): NftRecord[] {
  return nfts.filter((nft) => {
    if (params.collections && !params.collections.includes(nft.collectionId)) return false;
    if (params.networks && !params.networks.includes(nft.network)) return false;
    if (params.rarities && !params.rarities.includes(nft.rarity)) return false;
    if (params.priceMin && compareEth(nft.price, params.priceMin) < 0) return false;
    if (params.priceMax && compareEth(nft.price, params.priceMax) > 0) return false;
    return true;
  });
}

/**
 * Ordena os itens conforme a opcao escolhida.
 * Precos sao comparados como decimais (nunca como `number`).
 *
 * @param nfts - Itens filtrados.
 * @param sort - Ordenacao pedida.
 * @returns Nova lista ordenada.
 */
function applySort(nfts: NftRecord[], sort: NftSortOption): NftRecord[] {
  switch (sort) {
    case 'price-asc':
      return nfts.toSorted((left, right) => compareEth(left.price, right.price));
    case 'price-desc':
      return nfts.toSorted((left, right) => compareEth(right.price, left.price));
    case 'name-asc':
      return nfts.toSorted((left, right) => left.name.localeCompare(right.name));
    case 'popular':
      return nfts.toSorted((left, right) => right.favoritesCount - left.favoritesCount);
    case 'recent':
      return nfts.toSorted((left, right) => Date.parse(right.listedAt) - Date.parse(left.listedAt));
  }
}

/**
 * Conta ocorrencias por chave, preservando a ordem de exibicao informada.
 *
 * @param nfts - Itens considerados na contagem.
 * @param options - Chaves e rotulos na ordem de exibicao.
 * @param keyOf - Extrai a chave de um item.
 * @returns Opcoes com contagem.
 */
function countBy(
  nfts: NftRecord[],
  options: Array<{ id: string; label: string }>,
  keyOf: (nft: NftRecord) => string,
): NftFacetOption[] {
  return options.map((option) => ({
    id: option.id,
    label: option.label,
    count: nfts.filter((nft) => keyOf(nft) === option.id).length,
  }));
}

/**
 * Monta as contagens e a faixa de preco da sidebar.
 *
 * Colecao e rede publicam o tamanho do acervo declarado nas fixtures
 * (`catalogSize` / `NETWORK_CATALOG_SIZES`) — sao os numeros do
 * `design/Início.png`, que somam totais diferentes entre si e nao cabem em
 * nenhum acervo unico. Deixa-los na camada de mocks mantem o cliente livre de
 * dado ficticio e o filtro operando sobre os itens de verdade.
 *
 * A raridade e a faixa de preco continuam calculadas: saem da aba e da busca
 * ativas, mas ANTES dos filtros de colecao/rede/raridade/preco — assim marcar
 * um filtro nao zera as contagens dos outros, que e o comportamento esperado de
 * uma faceta.
 *
 * @param nfts - Itens apos aba e busca.
 * @param db - Estado do servidor simulado (fonte das colecoes).
 * @returns Facetas da listagem.
 */
function buildFacets(nfts: NftRecord[], db: MockDatabase): NftListFacets {
  const sortedPrices = nfts.map((nft) => nft.price).toSorted(compareEth);

  return {
    collections: db.collections.map((collection) => ({
      id: collection.id,
      label: collection.name,
      count: collection.catalogSize,
    })),
    networks: Object.values(NETWORKS).map((network) => ({
      id: network.id,
      label: network.label,
      count: NETWORK_CATALOG_SIZES[network.id],
    })),
    rarities: countBy(
      nfts,
      RARITY_IDS.map((rarity) => ({ id: rarity, label: RARITY_LABELS[rarity] })),
      (nft) => nft.rarity,
    ),
    priceRange: {
      min: sortedPrices[0] ?? '0',
      max: sortedPrices[sortedPrices.length - 1] ?? '0',
    },
  };
}

/**
 * Executa a consulta do catalogo.
 *
 * @param db - Estado do servidor simulado.
 * @param params - Parametros ja validados.
 * @param emptyCatalog - `true` no cenario de catalogo vazio.
 * @returns Pagina de resultados com facetas e o que foi aplicado.
 */
export function selectNfts(
  db: MockDatabase,
  params: NftListParams,
  emptyCatalog: boolean,
): NftListResponse {
  const tab = params.tab ?? DEFAULT_TAB;
  const sort = params.sort ?? DEFAULT_SORT;
  const page = params.page ?? FIRST_PAGE;
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;

  const catalog = emptyCatalog ? [] : db.nfts;
  const searched = applySearch(applyTab(catalog, tab), params.search);
  const filtered = applySort(applyFilters(searched, params), sort);

  const total = filtered.length;
  const start = (page - 1) * pageSize;

  return {
    items: filtered.slice(start, start + pageSize).map(toNftSummary),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    facets: buildFacets(searched, db),
    appliedSort: sort,
    appliedTab: tab,
  };
}

/**
 * Encontra um NFT por id ou slug (a rota de detalhe aceita os dois).
 *
 * @param db - Estado do servidor simulado.
 * @param identifier - Id ou slug do recurso.
 * @returns Registro encontrado ou `undefined`.
 */
export function findNft(db: MockDatabase, identifier: string): NftRecord | undefined {
  return db.nfts.find((nft) => nft.id === identifier || nft.slug === identifier);
}

/**
 * Converte o registro do store no detalhe publicado pela API.
 * `trendingScore` e sinal interno de ranking e nao vaza para o contrato.
 *
 * @param nft - Registro do store.
 * @returns Detalhe completo do NFT.
 */
export function toNftDetail(nft: NftRecord): NftDetail {
  const { trendingScore: _trendingScore, ...detail } = nft;
  return { ...detail, edition: { ...nft.edition }, gallery: [...nft.gallery], traits: [...nft.traits] };
}
