import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vitest/config';

/**
 * Configuracao do vitest — verificacao da camada de rede/mocks (Fase 1).
 *
 * Os testes de fluxo de interface ficam no Playwright; aqui exercitamos o api
 * client tipado contra os MESMOS handlers do MSW que rodam no navegador.
 *
 * Detalhe importante: `resolve.conditions` inclui `browser` para que o
 * `socket.io-client` carregue o transporte WebSocket do navegador (que usa o
 * `WebSocket` global). O `ws` do Node nao passa pelo interceptor do MSW — sem
 * isso, o teste de tempo real nao seria interceptado.
 */
export default defineConfig({
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      // O engine.io importa sempre `./websocket.node.js` e conta com o campo
      // `browser` do package.json para trocar pelo arquivo do navegador. Esse
      // remapeamento nao acontece na resolucao do Node, e a versao `.node`
      // abre a conexao pelo pacote `ws` — que o interceptor de WebSocket do
      // MSW nao substitui. Apontar para o arquivo do navegador faz o transporte
      // usar o `WebSocket` global, que e exatamente o que o MSW intercepta.
      { find: './websocket.node.js', replacement: './websocket.js' },
    ],
    conditions: ['browser', 'import', 'module', 'default'],
  },
  test: {
    environment: 'node',
    server: {
      deps: {
        // Sem isto o Node resolve o `socket.io-client` pela condicao "node" e o
        // transporte usa o pacote `ws`, que nao passa pelo interceptor de
        // WebSocket do MSW. Processados pelo Vite, os dois pacotes seguem a
        // condicao "browser" e usam o `WebSocket` global — que o MSW substitui.
        inline: ['socket.io-client', 'engine.io-client'],
      },
    },
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/test/setup.ts'],
    // Um arquivo por vez: o store simulado e um estado global por processo, e
    // paralelizar dentro do mesmo processo quebraria o isolamento por teste.
    fileParallelism: false,
    env: {
      // Base absoluta: em Node o Axios nao resolve caminho relativo.
      VITE_API_BASE_URL: 'http://localhost/api',
      VITE_SOCKET_URL: 'http://realtime.kurio.mock',
      VITE_ENABLE_MOCKS: 'true',
      // Timeout curto (o padrao do app e 15s) para o cenario de timeout de
      // pedido nao travar a suite. Precisa ficar acima da latencia maxima dos
      // cenarios lentos (2600ms), senao eles falhariam por timeout em vez de
      // exercitarem o carregamento.
      VITE_REQUEST_TIMEOUT_MS: '3000',
    },
  },
});
