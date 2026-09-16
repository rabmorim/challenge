import { HttpResponse, delay } from 'msw';

import { stableHash } from '@/mocks/lib/hash';
import { transientFailure } from '@/mocks/lib/responses';
import { getActiveScenario, getActiveScenarioId } from '@/mocks/scenarios/active';

/**
 * Condicoes de rede da simulacao: latencia, latencia variavel (que produz
 * respostas fora de ordem), indisponibilidade de conexao e erro 5xx.
 *
 * Todo handler de negocio comeca chamando `applyNetworkBehavior`. Os endpoints
 * de controle (`/__mocks/*`) nao passam por aqui de proposito: um teste precisa
 * conseguir trocar de cenario mesmo com a rede "caida".
 */

/** Requisicoes atendidas desde o ultimo reset — base do cenario `flaky`. */
let requestCount = 0;

/** Estado do gerador pseudoaleatorio semeado pelo cenario. */
let randomState = 0;

/**
 * Gera o proximo numero pseudoaleatorio em [0, 1).
 * Implementacao mulberry32: mesma semente, mesma sequencia — e o que torna
 * "latencia variavel" reproduzivel entre execucoes.
 *
 * @returns Numero em [0, 1).
 */
function nextRandom(): number {
  randomState = (randomState + 0x6d2b79f5) | 0;
  let value = randomState;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

/** Semeia o gerador a partir do id do cenario ativo. */
function seedRandom(): void {
  randomState = Number.parseInt(stableHash(getActiveScenarioId()), 16) | 0;
}

/**
 * Devolve os contadores de rede ao estado inicial.
 * Chamado no reset e na troca de cenario para que cada teste parta de um
 * estado isolado (enunciado §9).
 */
export function resetNetworkState(): void {
  requestCount = 0;
  seedRandom();
}

/**
 * Calcula a latencia desta resposta.
 *
 * @returns Espera em milissegundos.
 */
function resolveLatencyMs(): number {
  const { latency, jitter } = getActiveScenario().network;
  if (!jitter) return latency.minMs;

  if (randomState === 0) seedRandom();
  return Math.round(latency.minMs + nextRandom() * (latency.maxMs - latency.minMs));
}

/**
 * Aplica as condicoes de rede do cenario ativo.
 *
 * @returns Resposta de falha quando o cenario derruba a requisicao, ou `null`
 *   quando o handler deve seguir e responder normalmente.
 */
export async function applyNetworkBehavior(): Promise<Response | null> {
  const { network } = getActiveScenario();
  requestCount += 1;

  if (network.failure === 'offline') {
    // Sem status: o Axios recebe erro de rede, como numa conexao indisponivel.
    return HttpResponse.error();
  }

  await delay(resolveLatencyMs());

  if (network.failure === 'server-error') return transientFailure();

  if (network.failure === 'flaky' && requestCount <= network.failFirstRequests) {
    return transientFailure(
      'Instabilidade temporaria no servico. A proxima tentativa deve funcionar.',
    );
  }

  return null;
}

/**
 * Espera o tempo de latencia do cenario sem avaliar falhas.
 * Usado por respostas que precisam sentir a rede mas nao devem falhar (ex.: a
 * espera longa do cenario de timeout de pedido).
 *
 * @param milliseconds - Espera explicita; usa a latencia do cenario se omitida.
 */
export async function simulateLatency(milliseconds?: number): Promise<void> {
  await delay(milliseconds ?? resolveLatencyMs());
}
