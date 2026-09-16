import { isNetworkId } from '@/constants/network';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT,
  DEFAULT_TAB,
  FIRST_PAGE,
  RARITY_IDS,
  SORT_OPTION_LABELS,
  TAB_LABELS,
} from '@/features/catalog/constants/catalog';
import type { NftSortOption, NftTab } from '@/features/catalog/types/catalog-query';
import type {
  CatalogListParams,
  CatalogPatch,
  CatalogSearch,
} from '@/features/catalog/types/catalog-search';
import type { NftRarity } from '@/features/catalog/types/nft';
import type { EthAmount } from '@/types/api';
import type { NetworkId } from '@/types/network';

/**
 * Estado de URL do catálogo: validação, normalização e tradução para a API.
 *
 * Tudo aqui é função pura — a busca, os filtros, a ordenação e a paginação
 * vivem na barra de endereço, e a barra de endereço é entrada não confiável.
 * Nenhum componente monta ou interpreta esses parâmetros na mão.
 */

/** Ordenações conhecidas, derivadas dos rótulos para não duplicar a lista. */
const SORT_OPTIONS = Object.keys(SORT_OPTION_LABELS) as NftSortOption[];

/** Abas conhecidas, derivadas dos rótulos. */
const TABS = Object.keys(TAB_LABELS) as NftTab[];

/**
 * Verifica se o valor é uma ordenação conhecida.
 *
 * @param value - Valor bruto vindo da URL.
 * @returns `true` quando o valor pode ser usado como ordenação.
 */
export function isSortOption(value: unknown): value is NftSortOption {
  return SORT_OPTIONS.some((option) => option === value);
}

/**
 * Verifica se o valor é uma aba conhecida.
 *
 * @param value - Valor bruto vindo da URL.
 * @returns `true` quando o valor pode ser usado como aba.
 */
export function isTab(value: unknown): value is NftTab {
  return TABS.some((tab) => tab === value);
}

/**
 * Verifica se o valor é uma raridade conhecida.
 *
 * @param value - Valor bruto vindo da URL.
 * @returns `true` quando o valor pode ser usado como raridade.
 */
export function isRarity(value: unknown): value is NftRarity {
  return RARITY_IDS.some((rarity) => rarity === value);
}

/**
 * Normaliza uma lista de filtros vinda da URL.
 *
 * Aceita valor único ou lista, descarta o que não pertence ao domínio,
 * deduplica e **ordena** — duas URLs com os mesmos filtros em ordens
 * diferentes precisam produzir a mesma query key, senão o cache se divide sem
 * motivo.
 *
 * @param value - Valor bruto (string, lista ou qualquer outra coisa).
 * @param guard - Type guard do domínio esperado.
 * @returns Lista válida e canônica, ou `undefined` quando não sobrou nada.
 */
function readFilterList<TValue extends string>(
  value: unknown,
  guard: (candidate: unknown) => candidate is TValue,
): TValue[] | undefined {
  if (value === undefined || value === null) return undefined;

  // Só texto vira candidato: converter qualquer coisa com `String()` faria um
  // parâmetro ausente virar o id literal "undefined" e filtrar o catálogo por
  // uma coleção que não existe.
  const raw = (Array.isArray(value) ? value : [value]).filter(
    (item): item is string => typeof item === 'string',
  );

  const valid = [...new Set(raw.flatMap((item) => item.split(',')).filter(guard))].toSorted(
    (left, right) => left.localeCompare(right),
  );

  return valid.length > 0 ? valid : undefined;
}

/**
 * Lê um id de coleção livre (o domínio vem do servidor, não de um enum).
 *
 * @param value - Valor bruto vindo da URL.
 * @returns `true` quando o valor tem forma de id.
 */
function isCollectionId(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Lê um valor em ETH da URL.
 *
 * @param value - Valor bruto.
 * @returns String decimal finita e não negativa, ou `undefined`.
 */
function readEthAmount(value: unknown): EthAmount | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;

  const text = String(value).trim();
  if (text.length === 0) return undefined;

  const parsed = Number(text);
  return Number.isFinite(parsed) && parsed >= 0 ? text : undefined;
}

/**
 * Lê a página da URL.
 *
 * @param value - Valor bruto.
 * @returns Inteiro maior ou igual à primeira página, ou `undefined`.
 */
function readPage(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= FIRST_PAGE ? parsed : undefined;
}

/**
 * Remove da URL tudo que é padrão ou vazio.
 *
 * Sem isso `/` e `/?tab=all&sort=recent&page=1` seriam estados diferentes com o
 * mesmo resultado — duas entradas de cache, duas requisições e um histórico
 * cheio de passos que não mudam nada.
 *
 * @param search - Estado já validado.
 * @returns Estado canônico, pronto para virar URL e query key.
 */
export function normalizeCatalogSearch(search: CatalogSearch): CatalogSearch {
  const priceMin = readEthAmount(search.priceMin);
  const priceMax = readEthAmount(search.priceMax);
  // Faixa invertida não filtra nada e confundiria o slider: descarta as duas pontas.
  const hasValidRange = priceMin === undefined || priceMax === undefined || Number(priceMin) <= Number(priceMax);

  return {
    ...(search.search && search.search.trim().length > 0 ? { search: search.search.trim() } : {}),
    ...(search.collections && search.collections.length > 0 ? { collections: search.collections } : {}),
    ...(search.networks && search.networks.length > 0 ? { networks: search.networks } : {}),
    ...(search.rarities && search.rarities.length > 0 ? { rarities: search.rarities } : {}),
    ...(hasValidRange && priceMin !== undefined ? { priceMin } : {}),
    ...(hasValidRange && priceMax !== undefined ? { priceMax } : {}),
    ...(search.tab && search.tab !== DEFAULT_TAB ? { tab: search.tab } : {}),
    ...(search.sort && search.sort !== DEFAULT_SORT ? { sort: search.sort } : {}),
    ...(search.page && search.page > FIRST_PAGE ? { page: search.page } : {}),
  };
}

/**
 * Valida os parâmetros de busca das rotas de catálogo.
 *
 * Valor desconhecido ou malformado simplesmente desaparece, em vez de derrubar
 * a rota: uma URL colada errada não pode quebrar a aplicação.
 *
 * @param search - Parâmetros brutos da URL.
 * @returns Estado de catálogo validado e canônico.
 */
export function validateCatalogSearch(search: Record<string, unknown>): CatalogSearch {
  const collections = readFilterList(search.collections, isCollectionId);
  const networks = readFilterList<NetworkId>(search.networks, isNetworkId);
  const rarities = readFilterList<NftRarity>(search.rarities, isRarity);
  const priceMin = readEthAmount(search.priceMin);
  const priceMax = readEthAmount(search.priceMax);
  const page = readPage(search.page);

  return normalizeCatalogSearch({
    ...(typeof search.search === 'string' ? { search: search.search } : {}),
    ...(collections ? { collections } : {}),
    ...(networks ? { networks } : {}),
    ...(rarities ? { rarities } : {}),
    ...(priceMin ? { priceMin } : {}),
    ...(priceMax ? { priceMax } : {}),
    ...(isTab(search.tab) ? { tab: search.tab } : {}),
    ...(isSortOption(search.sort) ? { sort: search.sort } : {}),
    ...(page ? { page } : {}),
  });
}

/**
 * Aplica uma alteração ao estado de URL do catálogo.
 *
 * Regra única do reinício de paginação: **qualquer** mudança que não seja de
 * página volta para a primeira. O item da página 3 de um filtro não existe no
 * filtro seguinte, e paginação fora do total devolveria uma lista vazia que
 * parece "sem resultados". Por ser função pura e única, nenhum controle da
 * interface consegue esquecer a regra.
 *
 * @param current - Estado atual (já validado pela rota).
 * @param patch - Alteração pedida; `undefined` em uma chave a remove.
 * @returns Novo estado canônico.
 */
export function applyCatalogPatch(current: CatalogSearch, patch: CatalogPatch): CatalogSearch {
  const next: Record<string, unknown> = { ...current };

  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) delete next[key];
    else next[key] = value;
  }

  if (!('page' in patch)) delete next.page;

  return normalizeCatalogSearch(next as CatalogSearch);
}

/**
 * Alterna um valor em um filtro de lista (coleção, rede, raridade).
 *
 * @param values - Valores atualmente marcados.
 * @param value - Valor clicado.
 * @returns Nova lista, ou `undefined` quando o filtro fica vazio.
 */
export function toggleFilterValue<TValue extends string>(
  values: TValue[] | undefined,
  value: TValue,
): TValue[] | undefined {
  const current = values ?? [];
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value].toSorted((left, right) => left.localeCompare(right));

  return next.length > 0 ? next : undefined;
}

/**
 * Traduz o estado de URL nos parâmetros enviados à API.
 *
 * É a única ponte URL → requisição: o que sai daqui é o que o Axios serializa e
 * também o que entra na query key, então cache e rede nunca discordam.
 *
 * @param search - Estado de URL validado.
 * @returns Parâmetros completos da listagem, com os padrões resolvidos.
 */
export function toListParams(search: CatalogSearch): CatalogListParams {
  return {
    ...(search.search ? { search: search.search } : {}),
    ...(search.collections ? { collections: search.collections } : {}),
    ...(search.networks ? { networks: search.networks } : {}),
    ...(search.rarities ? { rarities: search.rarities } : {}),
    ...(search.priceMin ? { priceMin: search.priceMin } : {}),
    ...(search.priceMax ? { priceMax: search.priceMax } : {}),
    tab: search.tab ?? DEFAULT_TAB,
    sort: search.sort ?? DEFAULT_SORT,
    page: search.page ?? FIRST_PAGE,
    pageSize: DEFAULT_PAGE_SIZE,
  };
}

/**
 * Conta quantos filtros estão ativos.
 * Cada valor marcado conta um: escondidos atrás do botão de filtros no celular,
 * eles precisam continuar visíveis de alguma forma.
 *
 * @param search - Estado de URL.
 * @returns Quantidade de filtros aplicados.
 */
export function countActiveFilters(search: CatalogSearch): number {
  return (
    (search.search ? 1 : 0) +
    (search.collections?.length ?? 0) +
    (search.networks?.length ?? 0) +
    (search.rarities?.length ?? 0) +
    (search.priceMin ?? search.priceMax ? 1 : 0)
  );
}

/**
 * Informa se há algum filtro ativo (fora aba e ordenação, que sempre existem).
 *
 * @param search - Estado de URL.
 * @returns `true` quando algo pode ser limpo.
 */
export function hasActiveFilters(search: CatalogSearch): boolean {
  return Boolean(
    search.search ??
      search.collections ??
      search.networks ??
      search.rarities ??
      search.priceMin ??
      search.priceMax,
  );
}
