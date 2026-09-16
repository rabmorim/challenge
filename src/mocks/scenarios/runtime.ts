import { resetDatabase } from '@/mocks/db/store';
import { resetQuoteDrift } from '@/mocks/handlers/quotes';
import { getActiveScenario, getActiveScenarioId, setActiveScenarioId } from '@/mocks/scenarios/active';
import { resetNetworkState } from '@/mocks/scenarios/network';
import { clearScheduledTasks } from '@/mocks/socket/scheduler';
import type { ScenarioConfig, ScenarioId } from '@/mocks/types/scenario';

/**
 * Orquestracao do ciclo de vida da simulacao.
 *
 * Reset e troca de cenario passam por aqui para que os quatro estados voltem
 * juntos: dados semeados, contadores de rede, temporizadores agendados e o
 * desvio de preco pos-cotacao. E o que garante que "cada teste parte de estado
 * isolado" (enunciado §9) valha de verdade, sem resto do teste anterior.
 */

/**
 * Restaura integralmente o cenario conhecido.
 *
 * @param scenarioId - Cenario a aplicar; mantem o atual quando omitido.
 * @returns Configuracao do cenario em vigor apos o reset.
 */
export function resetSimulation(scenarioId?: ScenarioId): ScenarioConfig {
  clearScheduledTasks();

  if (scenarioId) setActiveScenarioId(scenarioId);
  resetDatabase(getActiveScenarioId());
  resetNetworkState();
  resetQuoteDrift();

  return getActiveScenario();
}

/**
 * Aplica outro cenario.
 *
 * Ressemear e o padrao (troca de cenario costuma significar "comece de novo"),
 * mas a troca sem ressemeadura existe para um caso concreto: verificar a
 * recuperacao depois de uma falha exige trocar a condicao de rede **sem**
 * derrubar a sessao nem desfazer o que ja foi feito na tela.
 *
 * @param scenarioId - Cenario a aplicar.
 * @param reseed - `false` mantem os dados e a sessao correntes.
 * @returns Configuracao do cenario aplicado.
 */
export function applyScenario(scenarioId: ScenarioId, reseed = true): ScenarioConfig {
  if (reseed) return resetSimulation(scenarioId);

  clearScheduledTasks();
  setActiveScenarioId(scenarioId);
  resetNetworkState();
  resetQuoteDrift();

  return getActiveScenario();
}
