import { afterAll, afterEach } from 'vitest';

import { clearGuestId, clearSessionToken } from '@/lib/request-identity';
import { server } from '@/mocks/node';
import { resetSimulation } from '@/mocks/scenarios/runtime';

/**
 * Setup dos testes de rede.
 *
 * ORDEM IMPORTA — e a mesma licao do `main.tsx`: o engine.io captura a
 * referencia de `WebSocket` quando seu modulo e avaliado. Como o vitest importa
 * os arquivos de teste (e, com eles, o `socket.io-client`) antes de rodar
 * qualquer hook, `server.listen()` roda aqui no escopo do modulo — e nao em
 * `beforeAll`. Em `beforeAll` o MSW instalaria o `WebSocket` dele tarde demais e
 * nenhuma conexao de tempo real seria interceptada.
 *
 * `onUnhandledRequest: 'error'` revela contrato faltando em vez de deixar a
 * requisicao vazar para a rede de verdade.
 */
server.listen({ onUnhandledRequest: 'error' });

afterEach(() => {
  server.resetHandlers();
  resetSimulation('default');
  // A identidade do cliente tambem volta ao zero: token de sessao e id de
  // visitante nao podem atravessar de um teste para o outro.
  clearSessionToken();
  clearGuestId();
});

afterAll(() => {
  server.close();
});
