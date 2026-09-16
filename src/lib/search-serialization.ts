import { parseSearchWith, stringifySearchWith } from '@tanstack/react-router';

/**
 * Serialização dos parâmetros de busca da aplicação.
 *
 * O padrão do TanStack Router é JSON: uma lista viraria
 * `?networks=%5B%22ethereum%22%5D` na barra de endereços. Como a URL do
 * catálogo é estado compartilhável — e é literalmente o corpo da consulta
 * enviada à API —, ela precisa ficar legível e no mesmo formato que o cliente
 * HTTP usa: `?networks=ethereum,polygon`.
 *
 * A leitura devolve texto puro, sem adivinhar tipos. Quem converte é o
 * validador de cada rota, que já precisa tratar entrada não confiável de
 * qualquer forma — inferir número ou booleano aqui só criaria um segundo lugar
 * onde a URL vira dado.
 */

/**
 * Converte o valor de um parâmetro no texto que vai para a URL.
 *
 * @param value - Valor devolvido pelo validador da rota.
 * @returns Texto do parâmetro.
 */
function stringifyValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(',');
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

/**
 * Lê um parâmetro da URL sem converter tipo.
 *
 * @param value - Texto já decodificado da query string.
 * @returns O mesmo texto.
 */
function parseValue(value: string): string {
  return value;
}

/** Leitor de query string usado pelo router. */
export const parseAppSearch = parseSearchWith(parseValue);

/** Escritor de query string usado pelo router. */
export const stringifyAppSearch = stringifySearchWith(stringifyValue);
