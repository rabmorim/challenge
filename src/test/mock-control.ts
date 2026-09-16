import { MOCK_CONTROL_PATHS } from '@/mocks/constants';
import { httpClient } from '@/lib/http';
import type {
  EmitNftEventRequest,
  EmitNftEventResponse,
  EmitOrderEventRequest,
  EmitOrderEventResponse,
  ExpireSessionsResponse,
  ScenarioStateResponse,
} from '@/mocks/types/control';
import type { ScenarioId } from '@/mocks/types/scenario';

/**
 * Atalhos para os endpoints de controle da simulacao.
 *
 * Os testes passam por HTTP (e nao chamam o store direto) de proposito: e o
 * mesmo caminho que o Playwright e a demonstracao usam, entao o controle fica
 * exercitado junto.
 */

/**
 * Troca o cenario ativo e ressemeia o estado.
 *
 * @param id - Cenario a aplicar.
 * @returns Estado do controle de cenarios.
 */
export async function selectScenario(id: ScenarioId): Promise<ScenarioStateResponse> {
  const { data } = await httpClient.post<ScenarioStateResponse>(MOCK_CONTROL_PATHS.scenario, { id });
  return data;
}

/**
 * Restaura integralmente o cenario informado (ou o atual).
 *
 * @param scenario - Cenario opcional.
 * @returns Estado do controle de cenarios.
 */
export async function resetScenario(scenario?: ScenarioId): Promise<ScenarioStateResponse> {
  const { data } = await httpClient.post<ScenarioStateResponse>(
    MOCK_CONTROL_PATHS.reset,
    scenario ? { scenario } : {},
  );
  return data;
}

/**
 * Dispara `nft.updated` com os valores informados.
 *
 * @param body - NFT e novos preco/disponibilidade.
 * @returns Evento emitido.
 */
export async function emitNftEvent(body: EmitNftEventRequest): Promise<EmitNftEventResponse> {
  const { data } = await httpClient.post<EmitNftEventResponse>(MOCK_CONTROL_PATHS.emitNft, body);
  return data;
}

/**
 * Dispara `order.updated` levando o pedido a um estado terminal.
 *
 * @param body - Pedido e estado.
 * @returns Pedido atualizado.
 */
export async function emitOrderEvent(body: EmitOrderEventRequest): Promise<EmitOrderEventResponse> {
  const { data } = await httpClient.post<EmitOrderEventResponse>(MOCK_CONTROL_PATHS.emitOrder, body);
  return data;
}

/**
 * Expira todas as sessoes ativas sem esperar o TTL.
 *
 * @returns Quantidade de sessoes expiradas.
 */
export async function expireAllSessions(): Promise<ExpireSessionsResponse> {
  const { data } = await httpClient.post<ExpireSessionsResponse>(
    MOCK_CONTROL_PATHS.expireSession,
    {},
  );
  return data;
}
