import { setupWorker } from 'msw/browser';

import { handlers } from '@/mocks/handlers';

/**
 * Worker do MSW para o navegador (dev, build de demonstracao e Playwright).
 * O arquivo `public/mockServiceWorker.js` e gerado por `pnpm msw:init`.
 */
export const worker = setupWorker(...handlers);
