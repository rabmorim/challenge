import type { Order } from '@/features/checkout/types/order';
import type { NftUpdatedEvent } from '@/features/realtime/types/events';
import type { ScenarioConfig, ScenarioId } from '@/mocks/types/scenario';
import type { EthAmount, Quantity } from '@/types/api';

/**
 * Contratos dos endpoints de controle da simulacao (`/__mocks/*`).
 *
 * Nao fazem parte da API do produto: existem para a demonstracao e para os
 * testes escolherem cenario, restaurar o estado e disparar eventos em um momento
 * exato — sem que o teste precise mexer no cache ou chamar setter na interface.
 */

/** Resumo de um cenario disponivel. */
export interface ScenarioSummary {
  id: ScenarioId;
  label: string;
  description: string;
}

/** Estado do controle de cenarios. */
export interface ScenarioStateResponse {
  active: ScenarioConfig;
  available: ScenarioSummary[];
}

/** Corpo da troca de cenario. */
export interface SelectScenarioRequest {
  id: ScenarioId;
  /**
   * `false` troca a configuracao sem ressemear os dados nem revogar sessoes.
   * E o que permite verificar a recuperacao de uma falha sem reiniciar a tela.
   */
  reseed?: boolean;
}

/** Corpo do reset (cenario opcional). */
export interface ResetSimulationRequest {
  scenario?: ScenarioId;
}

/** Corpo do disparo manual de `nft.updated`. */
export interface EmitNftEventRequest {
  nftId: string;
  price?: EthAmount;
  available?: Quantity;
  /**
   * Versao a declarar no envelope, SEM alterar o servidor.
   *
   * Serve so para produzir um evento antigo ou reentregue: com ela, o teste
   * consegue exigir do cliente o comportamento do enunciado §7 — descartar sem
   * regredir o estado mais novo. Omitida, o evento acompanha a versao real.
   */
  version?: number;
}

/** Resposta do disparo de `nft.updated`. */
export interface EmitNftEventResponse {
  event: NftUpdatedEvent;
}

/** Corpo do disparo manual de `order.updated`. */
export interface EmitOrderEventRequest {
  orderId: string;
  status: 'confirmed' | 'declined';
  declineReason?: Order['declineReason'];
}

/** Resposta do disparo de `order.updated`. */
export interface EmitOrderEventResponse {
  order: Order;
}

/** Resposta da expiracao forcada de sessoes. */
export interface ExpireSessionsResponse {
  expired: number;
}
