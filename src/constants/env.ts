import { REQUEST_TIMEOUT_MS } from '@/constants/api';

/**
 * Leitura centralizada e tipada das variaveis de ambiente do cliente.
 * Nenhum outro modulo deve tocar em `import.meta.env` diretamente — assim o
 * contrato de configuracao fica em um unico lugar e e facil de auditar.
 */
export const ENV = {
  /** URL base da API REST (ver `src/lib/http.ts`). */
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  /** Origem do servidor Socket.IO. */
  socketUrl: import.meta.env.VITE_SOCKET_URL,
  /** Camada de mocks (MSW) ativa. */
  mocksEnabled: import.meta.env.VITE_ENABLE_MOCKS === 'true',
  /**
   * Cenario de mocks pedido por configuracao. Vazio deixa a decisao para a URL
   * (`?scenario=`) ou para o cenario padrao.
   */
  mockScenario: import.meta.env.VITE_MOCK_SCENARIO ?? '',
  /**
   * Timeout das requisicoes REST. Configuravel para que os testes possam
   * exercitar o cenario de timeout de pedido sem esperar 15 segundos.
   */
  requestTimeoutMs: Number(import.meta.env.VITE_REQUEST_TIMEOUT_MS ?? '') || REQUEST_TIMEOUT_MS,
  /** `true` durante `vite dev`. */
  isDev: import.meta.env.DEV,
} as const;
