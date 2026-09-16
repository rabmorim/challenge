import { defineConfig, devices } from '@playwright/test';

/** Porta do servidor de desenvolvimento (espelha `vite.config.ts`). */
const DEV_SERVER_PORT = 5173;
const BASE_URL = `http://localhost:${String(DEV_SERVER_PORT)}`;

/** Arquivos de regressao visual — rodam apenas no projeto `visual`. */
const VISUAL_SPEC_PATTERN = /.*\.visual\.spec\.ts/;

/**
 * Configuracao do Playwright.
 *
 * Os fluxos rodam em Chromium nos viewports desktop (1440) e mobile (390).
 * A regressao visual fica isolada no projeto `visual` para que baselines
 * desatualizadas nao derrubem a suite funcional.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Interface e conteudo em portugues do Brasil.
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  },

  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },

  projects: [
    {
      name: 'chromium-desktop',
      testIgnore: VISUAL_SPEC_PATTERN,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'chromium-mobile',
      testIgnore: VISUAL_SPEC_PATTERN,
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'visual',
      testMatch: VISUAL_SPEC_PATTERN,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
