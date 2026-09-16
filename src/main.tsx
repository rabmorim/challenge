import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@/app/globals.css';
import { startMocks } from '@/mocks/start';

/**
 * Sobe a aplicacao.
 *
 * A ordem aqui e critica: o engine.io do `socket.io-client`
 * captura a referencia global de `WebSocket` no momento em que seu modulo e
 * avaliado. Como os imports estaticos sao avaliados antes de qualquer codigo
 * rodar, importar a arvore do app no topo faria o socket guardar o `WebSocket`
 * nativo antes de o MSW instalar o dele — e nenhum evento seria interceptado.
 *
 * Por isso `@/app/app` entra por import dinamico, depois de `startMocks()`.
 *
 * @throws {Error} Quando o elemento `#root` nao existe no documento.
 */
async function bootstrap(): Promise<void> {
  await startMocks();

  const { App } = await import('@/app/app');

  const container = document.getElementById('root');
  if (!container) {
    throw new Error('Elemento #root nao encontrado no documento.');
  }

  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();
