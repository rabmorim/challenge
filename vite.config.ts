import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';


/**
 * Configuracao do Vite.
 *
 * Ordem dos plugins importa: o plugin do TanStack Router precisa rodar ANTES do
 * plugin do React para conseguir gerar/transformar a arvore de rotas.
 *
 * O diretorio `src/routes` e a fonte das rotas baseadas em arquivo; o arquivo
 * `src/routeTree.gen.ts` e gerado automaticamente e nao deve ser editado a mao.
 */
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  build: {
    target: 'es2022',
    // Sem sourcemap no build de demonstracao: sao ~3,8 MB de arquivos que a
    // Vercel serve e ninguem baixa, e o `dist` e o que vai publicado.
    sourcemap: false,
  },
});
