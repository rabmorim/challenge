import {
  DEFAULT_SCENARIO,
  MOCK_STATE_SCHEMA_VERSION,
  MOCK_STATE_STORAGE_KEY,
} from '@/mocks/constants';
import { createSeededDatabase, getSeedSignature } from '@/mocks/fixtures';
import type { MockDatabase, PersistedMockState } from '@/mocks/types/db';

/**
 * Store do servidor simulado.
 *
 * E um objeto em memoria semeado pelas fixtures, espelhado no `localStorage`
 * apenas para sobreviver ao refresh. Escrevemos um store proprio (em vez de
 * `@mswjs/data`) porque o dominio pede coisas que a lib nao modela: versao
 * monotonica por recurso (base do tempo real), valores em ETH como string
 * decimal e registro de idempotencia de pedido.
 *
 * Nada aqui filtra por usuario: o isolamento e responsabilidade dos seletores
 * e handlers, que sempre recebem o dono da requisicao.
 */

/** Estado corrente; `null` antes da primeira leitura. */
let database: MockDatabase | null = null;

/** Cenario que semeou o estado corrente. */
let scenarioId: string = DEFAULT_SCENARIO;

/**
 * Devolve o `localStorage` quando disponivel.
 * Em ambiente Node (vitest) e em navegador com storage bloqueado o acesso
 * lanca — nesses casos a simulacao roda so em memoria.
 *
 * @returns O storage utilizavel ou `null`.
 */
function getStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * Le o estado persistido, descartando o que nao serve mais.
 *
 * Sao dois descartes diferentes: `schemaVersion` protege contra mudanca na
 * FORMA do envelope; `seedSignature` protege contra mudanca no CONTEUDO das
 * fixtures — sem ela, editar o catalogo nao teria efeito nenhum em quem ja
 * abriu a aplicacao antes, porque o navegador restauraria o acervo anterior.
 *
 * @returns Estado persistido valido ou `null`.
 */
function readPersistedState(): PersistedMockState | null {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(MOCK_STATE_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PersistedMockState>;
    if (parsed.schemaVersion !== MOCK_STATE_SCHEMA_VERSION) return null;
    if (parsed.seedSignature !== getSeedSignature()) return null;
    if (!parsed.database || typeof parsed.scenarioId !== 'string') return null;

    return {
      schemaVersion: parsed.schemaVersion,
      seedSignature: parsed.seedSignature,
      scenarioId: parsed.scenarioId,
      database: parsed.database,
    };
  } catch {
    // Estado corrompido nao pode derrubar a simulacao: ressemeia.
    return null;
  }
}

/**
 * Grava o estado corrente no storage.
 * Falha de quota ou storage indisponivel e ignorada de proposito: a simulacao
 * continua valendo em memoria.
 */
export function commitDatabase(): void {
  const storage = getStorage();
  if (!storage || !database) return;

  const state: PersistedMockState = {
    schemaVersion: MOCK_STATE_SCHEMA_VERSION,
    seedSignature: getSeedSignature(),
    scenarioId,
    database,
  };

  try {
    storage.setItem(MOCK_STATE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Sem persistencia, o estado vale apenas para esta sessao.
  }
}

/** Remove o estado persistido, sem tocar no estado em memoria. */
export function clearPersistedState(): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.removeItem(MOCK_STATE_STORAGE_KEY);
  } catch {
    // Nada a fazer: o proximo commit sobrescreve.
  }
}

/**
 * Devolve o estado corrente, restaurando do storage ou semeando na primeira vez.
 *
 * @returns Estado mutavel do servidor simulado.
 */
export function getDatabase(): MockDatabase {
  if (database) return database;

  const persisted = readPersistedState();
  if (persisted) {
    database = persisted.database;
    scenarioId = persisted.scenarioId;
    return database;
  }

  database = createSeededDatabase();
  commitDatabase();
  return database;
}

/**
 * Restaura integralmente o estado semeado.
 *
 * @param nextScenarioId - Cenario que passa a valer; mantem o atual se omitido.
 * @returns Novo estado, ja persistido.
 */
export function resetDatabase(nextScenarioId?: string): MockDatabase {
  scenarioId = nextScenarioId ?? scenarioId;
  database = createSeededDatabase();
  commitDatabase();
  return database;
}

/**
 * Le o cenario que semeou o estado corrente (inclusive o restaurado do storage).
 *
 * @returns Id do cenario ativo no store.
 */
export function getStoredScenarioId(): string {
  // Forca a leitura do estado persistido antes de responder.
  getDatabase();
  return scenarioId;
}

/**
 * Troca o cenario associado ao estado corrente, sem ressemear.
 * Usado quando o cenario muda apenas o comportamento de rede.
 *
 * @param nextScenarioId - Id do cenario.
 */
export function setStoredScenarioId(nextScenarioId: string): void {
  getDatabase();
  scenarioId = nextScenarioId;
  commitDatabase();
}

/**
 * Incrementa e devolve um contador sequencial do store.
 * Ids sequenciais (em vez de aleatorios) mantem os testes previsiveis.
 *
 * @param name - Nome do contador (ver `SEQUENCE_NAMES`).
 * @returns Novo valor do contador.
 */
export function nextSequence(name: string): number {
  const db = getDatabase();
  const next = (db.sequences[name] ?? 0) + 1;
  db.sequences[name] = next;
  return next;
}
