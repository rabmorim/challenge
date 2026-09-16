import { HttpResponse, http, type HttpHandler } from 'msw';

import { MOCK_CONTROL_PATHS } from '@/mocks/constants';
import { updateNftMarket } from '@/mocks/db/nfts';
import { expireSessions } from '@/mocks/db/session';
import { transitionOrder } from '@/mocks/db/orders';
import { commitDatabase, getDatabase } from '@/mocks/db/store';
import { apiUrl, readJsonBody } from '@/mocks/handlers/shared';
import { conflict, notFound, validationError } from '@/mocks/lib/responses';
import { getActiveScenario, getActiveScenarioId } from '@/mocks/scenarios/active';
import { SCENARIOS, SCENARIO_IDS, isScenarioId } from '@/mocks/scenarios/registry';
import { applyScenario, resetSimulation } from '@/mocks/scenarios/runtime';
import { emitNftUpdated, emitStaleNftUpdated } from '@/mocks/socket/emitter';
import type {
  EmitNftEventRequest,
  EmitNftEventResponse,
  EmitOrderEventRequest,
  EmitOrderEventResponse,
  ExpireSessionsResponse,
  ResetSimulationRequest,
  ScenarioStateResponse,
  SelectScenarioRequest,
} from '@/mocks/types/control';

/**
 * Endpoints de controle da simulacao.
 *
 * Nao passam pelas condicoes de rede de proposito: um teste precisa conseguir
 * trocar de cenario e restaurar o estado mesmo no cenario `offline`.
 *
 * Disparar evento por aqui mantem a regra de ouro: o evento sai do servidor
 * simulado pelo Socket.IO e a interface so o recebe pelo `socket.io-client` —
 * nada de setter direto no cache.
 */

/**
 * Monta a resposta com o cenario ativo e a lista de cenarios.
 *
 * @returns Estado do controle de cenarios.
 */
function toScenarioState(): ScenarioStateResponse {
  return {
    active: getActiveScenario(),
    available: SCENARIO_IDS.map((id) => ({
      id,
      label: SCENARIOS[id].label,
      description: SCENARIOS[id].description,
    })),
  };
}

/** Handlers de controle da simulacao. */
export const controlHandlers: HttpHandler[] = [
  http.get(apiUrl(MOCK_CONTROL_PATHS.scenario), () =>
    HttpResponse.json<ScenarioStateResponse>(toScenarioState()),
  ),

  http.post(apiUrl(MOCK_CONTROL_PATHS.scenario), async ({ request }) => {
    const body = await readJsonBody<SelectScenarioRequest>(request);

    if (!isScenarioId(body?.id)) {
      return validationError({ id: 'Cenario desconhecido.' });
    }

    applyScenario(body.id, body.reseed ?? true);
    return HttpResponse.json<ScenarioStateResponse>(toScenarioState());
  }),

  http.post(apiUrl(MOCK_CONTROL_PATHS.reset), async ({ request }) => {
    const body = await readJsonBody<ResetSimulationRequest>(request);

    if (body?.scenario !== undefined && !isScenarioId(body.scenario)) {
      return validationError({ scenario: 'Cenario desconhecido.' });
    }

    resetSimulation(body?.scenario);
    return HttpResponse.json<ScenarioStateResponse>(toScenarioState());
  }),

  http.post(apiUrl(MOCK_CONTROL_PATHS.emitNft), async ({ request }) => {
    const body = await readJsonBody<EmitNftEventRequest>(request);
    if (!body?.nftId) return validationError({ nftId: 'Informe o NFT.' });

    const db = getDatabase();
    const nft = db.nfts.find((candidate) => candidate.id === body.nftId);
    if (!nft) return notFound('NFT nao encontrado.');

    if (body.version !== undefined) {
      // Evento fora de ordem: versao escolhida e valores que nao estao no
      // store. O servidor nao muda — quem esta sob teste e o descarte no
      // cliente.
      return HttpResponse.json<EmitNftEventResponse>({
        event: emitStaleNftUpdated(nft, body.version, {
          ...(body.price !== undefined ? { price: body.price } : {}),
          ...(body.available !== undefined ? { available: body.available } : {}),
        }),
      });
    }

    if (body.price === undefined && body.available === undefined) {
      // Sem mudanca de estado: reemite o evento atual, o que permite testar
      // duplicatas e eventos antigos sem alterar o recurso.
      return HttpResponse.json<EmitNftEventResponse>({ event: emitNftUpdated(nft) });
    }

    const event = updateNftMarket(nft, {
      ...(body.price !== undefined ? { price: body.price } : {}),
      ...(body.available !== undefined ? { available: body.available } : {}),
    });

    return HttpResponse.json<EmitNftEventResponse>({ event });
  }),

  http.post(apiUrl(MOCK_CONTROL_PATHS.emitOrder), async ({ request }) => {
    const body = await readJsonBody<EmitOrderEventRequest>(request);

    if (!body?.orderId || (body.status !== 'confirmed' && body.status !== 'declined')) {
      return validationError({ status: 'Informe o pedido e um estado terminal.' });
    }

    const db = getDatabase();
    const order = db.orders.find((candidate) => candidate.id === body.orderId);
    if (!order) return notFound('Pedido nao encontrado.');

    const updated = transitionOrder(db, order, body.status, {
      scenario: getActiveScenarioId(),
      ...(body.declineReason ? { declineReason: body.declineReason } : {}),
    });

    if (!updated) {
      return conflict('ORDER_ALREADY_FINALIZED', 'Este pedido ja esta em estado terminal.');
    }

    return HttpResponse.json<EmitOrderEventResponse>({ order: updated });
  }),

  http.post(apiUrl(MOCK_CONTROL_PATHS.expireSession), () => {
    const db = getDatabase();
    const expired = expireSessions(db);
    commitDatabase();

    return HttpResponse.json<ExpireSessionsResponse>({ expired });
  }),
];
