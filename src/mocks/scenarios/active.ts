import { DEFAULT_SCENARIO, SCENARIO_URL_PARAM } from '@/mocks/constants';
import { getStoredScenarioId, setStoredScenarioId } from '@/mocks/db/store';
import { SCENARIOS, isScenarioId } from '@/mocks/scenarios/registry';
import type { ScenarioConfig, ScenarioId } from '@/mocks/types/scenario';

/**
 * Cenario ativo da simulacao.
 *
 * A resolucao acontece uma vez, na primeira leitura, nesta ordem:
 * 1. cenario gravado junto com o estado (sobrevive ao refresh e ao endpoint de controle);
 * 2. parametro de URL `?scenario=<id>` (como a demonstracao e o Playwright escolhem);
 * 3. variavel de ambiente `VITE_MOCK_SCENARIO` (como o build de demonstracao fixa um cenario);
 * 4. `default`.
 */

/** Cenario resolvido; `null` antes da primeira leitura. */
let activeScenarioId: ScenarioId | null = null;

/**
 * Le o cenario pedido na URL da pagina.
 *
 * @returns Id valido encontrado na URL ou `null` (inclusive em Node, sem `location`).
 */
function readScenarioFromUrl(): ScenarioId | null {
  const search = globalThis.location?.search;
  if (!search) return null;

  const requested = new URLSearchParams(search).get(SCENARIO_URL_PARAM);
  return isScenarioId(requested) ? requested : null;
}

/**
 * Le o cenario definido por variavel de ambiente.
 *
 * @returns Id valido ou `null`.
 */
function readScenarioFromEnv(): ScenarioId | null {
  const requested = import.meta.env.VITE_MOCK_SCENARIO;
  return isScenarioId(requested) ? requested : null;
}

/**
 * Resolve o cenario ativo, aplicando a ordem de precedencia.
 *
 * @returns Id do cenario que passa a valer.
 */
function resolveScenarioId(): ScenarioId {
  const stored = getStoredScenarioId();
  if (stored !== DEFAULT_SCENARIO && isScenarioId(stored)) return stored;

  return readScenarioFromUrl() ?? readScenarioFromEnv() ?? DEFAULT_SCENARIO;
}

/**
 * Le o id do cenario ativo.
 *
 * @returns Id do cenario.
 */
export function getActiveScenarioId(): ScenarioId {
  activeScenarioId ??= resolveScenarioId();
  return activeScenarioId;
}

/**
 * Le a configuracao completa do cenario ativo.
 *
 * @returns Cenario ativo.
 */
export function getActiveScenario(): ScenarioConfig {
  return SCENARIOS[getActiveScenarioId()];
}

/**
 * Passa a valer outro cenario, gravando a escolha junto com o estado.
 * Nao ressemeia o store — quem faz isso e `resetSimulation`, em `runtime.ts`.
 *
 * @param scenarioId - Id do cenario.
 * @returns Configuracao do cenario aplicado.
 */
export function setActiveScenarioId(scenarioId: ScenarioId): ScenarioConfig {
  activeScenarioId = scenarioId;
  setStoredScenarioId(scenarioId);
  return SCENARIOS[scenarioId];
}
