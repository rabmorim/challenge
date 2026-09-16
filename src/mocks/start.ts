import { ENV } from '@/constants/env';

/**
 * Liga a camada de mocks quando `VITE_ENABLE_MOCKS=true`.
 *
 * Precisa ser aguardado ANTES de renderizar o app e, principalmente, antes de
 * abrir qualquer socket: o engine.io captura a referencia de `WebSocket` na
 * primeira conexao, e o MSW so intercepta se ja estiver instalado.
 *
 * O import e dinamico para que o bundle de producao sem mocks nao carregue o
 * worker nem os fixtures.
 *
 * @returns Promessa resolvida quando o worker esta pronto (ou imediatamente,
 *   se a camada de mocks estiver desligada).
 */
export async function startMocks(): Promise<void> {
  if (!ENV.mocksEnabled) return;

  const { worker } = await import('@/mocks/browser');

  await worker.start({
    // Requisicoes nao mapeadas (assets, fontes) seguem para a rede sem ruido.
    onUnhandledRequest: 'bypass',
    quiet: !ENV.isDev,
    serviceWorker: {
      url: `${import.meta.env.BASE_URL}mockServiceWorker.js`,
    },
  });
}
