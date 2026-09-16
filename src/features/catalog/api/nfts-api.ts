import type { AxiosRequestConfig } from 'axios';

import { API_PATHS } from '@/constants/api';
import type { NftListParams, NftListResponse } from '@/features/catalog/types/catalog-query';
import type { NftDetail } from '@/features/catalog/types/nft';
import { httpClient } from '@/lib/http';

/**
 * Chamadas REST do catalogo.
 * Os parametros viajam exatamente como chegam da URL — sem traducao no meio,
 * para que a consulta reflita o estado da rota.
 */

/**
 * Serializa os parametros de listagem na query string.
 * Listas viram parametros repetidos (`?networks=ethereum&networks=polygon`), o
 * que mantem a URL legivel e combinavel.
 *
 * @param params - Parametros de busca, filtro, ordenacao e paginacao.
 * @returns Query string pronta para a requisicao.
 */
function toSearchParams(params: NftListParams): URLSearchParams {
  const search = new URLSearchParams();

  if (params.search) search.set('search', params.search);
  for (const collection of params.collections ?? []) search.append('collections', collection);
  for (const network of params.networks ?? []) search.append('networks', network);
  for (const rarity of params.rarities ?? []) search.append('rarities', rarity);
  if (params.priceMin) search.set('priceMin', params.priceMin);
  if (params.priceMax) search.set('priceMax', params.priceMax);
  if (params.tab) search.set('tab', params.tab);
  if (params.sort) search.set('sort', params.sort);
  if (params.page) search.set('page', String(params.page));
  if (params.pageSize) search.set('pageSize', String(params.pageSize));

  return search;
}

/**
 * Lista NFTs com busca, filtros, ordenacao e paginacao.
 *
 * @param params - Parametros da consulta.
 * @param signal - `AbortSignal` do TanStack Query, para descartar respostas obsoletas.
 * @returns Pagina de resultados com facetas.
 */
export async function listNfts(
  params: NftListParams,
  signal?: AbortSignal,
): Promise<NftListResponse> {
  const config: AxiosRequestConfig = { params: toSearchParams(params) };
  if (signal) config.signal = signal;

  const { data } = await httpClient.get<NftListResponse>(API_PATHS.nfts, config);
  return data;
}

/**
 * Consulta o detalhe de um NFT por id ou slug.
 *
 * @param nftId - Id ou slug do recurso.
 * @param signal - `AbortSignal` do TanStack Query.
 * @returns Detalhe completo do NFT.
 * @throws {NormalizedHttpError} `NOT_FOUND` quando o NFT nao existe.
 */
export async function fetchNft(nftId: string, signal?: AbortSignal): Promise<NftDetail> {
  const { data } = await httpClient.get<NftDetail>(API_PATHS.nftById(nftId), signal ? { signal } : undefined);
  return data;
}
