import { HttpResponse, http, type HttpHandler } from 'msw';

import { API_PATTERNS } from '@/constants/api';
import { apiUrl } from '@/mocks/handlers/shared';
import { getActiveScenarioId } from '@/mocks/scenarios/active';
import type { HealthResponse } from '@/types/api';

/**
 * `GET /health` — sonda de disponibilidade da camada simulada.
 *
 * Serve de exemplo canonico de handler e prova, ainda na Fase 0, que a cadeia
 * Axios -> MSW -> TanStack Query esta ligada. Nenhum dado ficticio vive fora
 * daqui: componentes, hooks e o cliente Axios nao carregam resposta simulada.
 *
 * @returns `200` com o cenario ativo e o horario da resposta.
 */
export const healthHandlers: HttpHandler[] = [
  http.get(apiUrl(API_PATTERNS.health), () =>
    HttpResponse.json<HealthResponse>({
      status: 'ok',
      scenario: getActiveScenarioId(),
      timestamp: new Date().toISOString(),
    }),
  ),
];
