/// <reference types="vite/client" />

/**
 * Variaveis de ambiente expostas ao cliente (prefixo `VITE_`).
 * Documentadas no `.env.example`.
 */
interface ImportMetaEnv {
  /** URL base da API REST consumida pela instancia unica do Axios. */
  readonly VITE_API_BASE_URL: string;
  /** URL do servidor Socket.IO (interceptada pelo MSW no ambiente de mocks). */
  readonly VITE_SOCKET_URL: string;
  /** Liga a camada de mocks (MSW). `'true'` ativa; qualquer outro valor desliga. */
  readonly VITE_ENABLE_MOCKS: string;
  /** Cenario de mocks aplicado no boot (ver `src/mocks/scenarios/registry.ts`). */
  readonly VITE_MOCK_SCENARIO?: string;
  /** Timeout (ms) das requisicoes REST; usa o padrao do app quando ausente. */
  readonly VITE_REQUEST_TIMEOUT_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
