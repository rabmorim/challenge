import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';
import desktopPreset from 'lighthouse/core/config/desktop-config.js';

import { LIGHTHOUSE_CONFIG } from '../lighthouse.config.mjs';

const { origin, pages, profiles, runs, thresholds, outputDir } = LIGHTHOUSE_CONFIG;
const CATEGORIES = Object.keys(thresholds);
const SERVER_READY_TIMEOUT_MS = 60_000;
const SERVER_POLL_INTERVAL_MS = 500;

/**
 * Sobe `vite preview` e espera a porta responder.
 *
 * @returns Processo do servidor, para ser encerrado ao fim da auditoria.
 * @throws {Error} Quando o servidor nao responde dentro do tempo limite.
 */
async function startPreviewServer() {
  const server = spawn('pnpm', ['preview'], { shell: true, stdio: 'ignore' });
  const deadline = Date.now() + SERVER_READY_TIMEOUT_MS;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(origin, { method: 'HEAD' });
      if (response.ok) return server;
    } catch {
      // Servidor ainda subindo — tenta de novo.
    }
    await delay(SERVER_POLL_INTERVAL_MS);
  }

  server.kill();
  throw new Error(`O servidor de preview nao respondeu em ${origin}.`);
}

/**
 * Calcula a mediana de uma lista de numeros.
 *
 * @param values - Valores medidos.
 * @returns Mediana; para tamanho par, a media dos dois centrais.
 */
function median(values) {
  const sorted = values.toSorted((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

/**
 * Executa uma medicao do Lighthouse.
 *
 * @param url - URL absoluta auditada.
 * @param profile - `'mobile'` ou `'desktop'`.
 * @param port - Porta de depuracao do Chrome ja iniciado.
 * @returns Resultado bruto do Lighthouse (LHR + relatorio HTML).
 */
async function runAudit(url, profile, port) {
  const options = { port, output: ['html', 'json'], onlyCategories: CATEGORIES };
  const config = profile === 'desktop' ? desktopPreset : undefined;
  return lighthouse(url, options, config);
}

/**
 * Roda a auditoria completa: cada pagina, em cada perfil, `runs` vezes.
 * Publica a mediana por categoria e as metricas LCP/CLS/TBT, alem de gravar os
 * relatorios HTML e JSON de cada medicao.
 *
 * @returns Codigo de saida: `1` se alguma mediana ficar abaixo da meta.
 */
async function main() {
  await mkdir(outputDir, { recursive: true });

  const server = await startPreviewServer();
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new'] });
  const summary = [];

  try {
    for (const page of pages) {
      for (const profile of profiles) {
        const url = new URL(page.path, origin).toString();
        const scores = Object.fromEntries(CATEGORIES.map((category) => [category, []]));
        const metrics = { lcp: [], cls: [], tbt: [] };

        for (let run = 1; run <= runs; run += 1) {
          const result = await runAudit(url, profile, chrome.port);
          const lhr = result.lhr;

          for (const category of CATEGORIES) {
            scores[category].push(Math.round(lhr.categories[category].score * 100));
          }
          metrics.lcp.push(lhr.audits['largest-contentful-paint'].numericValue);
          metrics.cls.push(lhr.audits['cumulative-layout-shift'].numericValue);
          metrics.tbt.push(lhr.audits['total-blocking-time'].numericValue);

          const base = join(outputDir, `${page.name}-${profile}-run${String(run)}`);
          await writeFile(`${base}.html`, result.report[0], 'utf8');
          await writeFile(`${base}.json`, result.report[1], 'utf8');
        }

        summary.push({
          page: page.name,
          profile,
          scores: Object.fromEntries(
            CATEGORIES.map((category) => [category, median(scores[category])]),
          ),
          metrics: {
            lcpMs: Math.round(median(metrics.lcp)),
            cls: Number(median(metrics.cls).toFixed(3)),
            tbtMs: Math.round(median(metrics.tbt)),
          },
        });
      }
    }
  } finally {
    await chrome.kill();
    server.kill();
  }

  await writeFile(join(outputDir, 'summary.json'), JSON.stringify(summary, null, 2), 'utf8');

  let failed = false;
  for (const entry of summary) {
    const line = CATEGORIES.map((c) => `${c}=${String(entry.scores[c])}`).join(' · ');
    console.log(`${entry.page} [${entry.profile}] ${line}`);
    console.log(
      `  LCP ${String(entry.metrics.lcpMs)}ms · CLS ${String(entry.metrics.cls)} · TBT ${String(entry.metrics.tbtMs)}ms`,
    );
    for (const category of CATEGORIES) {
      if (entry.scores[category] < thresholds[category]) {
        failed = true;
        console.error(
          `  ABAIXO DA META: ${category} ${String(entry.scores[category])} < ${String(thresholds[category])}`,
        );
      }
    }
  }

  return failed ? 1 : 0;
}

process.exitCode = await main();
