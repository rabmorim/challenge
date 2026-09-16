import { setupServer } from 'msw/node';

import { handlers } from '@/mocks/handlers';

/**
 * Servidor do MSW para Node (vitest).
 *
 * Os mesmos handlers do navegador — e o que garante que a verificacao
 * automatizada exercite exatamente o contrato que a aplicacao consome, sem uma
 * segunda implementacao de mock so para os testes.
 */
export const server = setupServer(...handlers);
