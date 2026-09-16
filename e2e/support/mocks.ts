import { expect, type Page } from '@playwright/test';

/**
 * Controle da simulacao nos testes de interface.
 *
 * As chamadas rodam NO CONTEXTO DA PAGINA (`page.evaluate`), e nao pelo
 * `request` do Playwright: os endpoints de controle vivem dentro do service
 * worker do MSW, entao uma requisicao feita de fora do navegador nao seria
 * interceptada por ele.
 */

/** Prefixo da API simulada (espelha `VITE_API_BASE_URL`). */
const API_BASE_URL = '/api';

/** Endpoints de controle usados pelos testes. */
const CONTROL_PATHS = {
  reset: `${API_BASE_URL}/__mocks/reset`,
  scenario: `${API_BASE_URL}/__mocks/scenario`,
  expireSession: `${API_BASE_URL}/__mocks/session/expire`,
  emitNft: `${API_BASE_URL}/__mocks/events/nft`,
  emitOrder: `${API_BASE_URL}/__mocks/events/order`,
} as const;

/** Chave do `localStorage` com a identidade do visitante (espelha `src/constants/storage.ts`). */
const GUEST_ID_STORAGE_KEY = 'kurio:guest-id';

/** Chave do `localStorage` com o token da sessao (espelha `src/constants/storage.ts`). */
const SESSION_TOKEN_STORAGE_KEY = 'kurio:session-token';

/** Prazo de espera pelo primeiro render com o worker do MSW instalado. */
const APP_BOOT_TIMEOUT_MS = 20_000;

/** Cenarios usados nesta suite. */
export type TestScenario =
  | 'default'
  | 'slow'
  | 'empty'
  | 'out-of-order'
  | 'server-error'
  | 'favorite-error'
  | 'price-changed'
  | 'sold-out'
  | 'order-timeout'
  | 'payment-declined'
  | 'payment-manual'
  | 'wallet-refused';

/**
 * Abre o app com um cenario conhecido e restaura o estado simulado.
 *
 * Cada teste roda em um contexto de navegador novo (storage vazio), e o reset
 * garante o resto: dados semeados, contadores de rede e temporizadores voltam
 * ao ponto de partida antes da primeira interacao.
 *
 * @param page - Pagina do teste.
 * @param scenario - Cenario a aplicar (padrao: `default`).
 * @param path - Caminho aberto depois do reset (padrao: a Inicio).
 * @param waitForBoot - Espera o esqueleto do app antes de devolver. Passe
 *   `false` quando o teste precisa observar o PRIMEIRO quadro: esperar o
 *   esqueleto consome parte da janela de carregamento e, com a suite em paralelo,
 *   o dado pode chegar antes de a espera terminar.
 */
export async function startApp(
  page: Page,
  scenario: TestScenario = 'default',
  path = '/',
  waitForBoot = true,
): Promise<void> {
  // O primeiro carregamento usa o cenario padrao de proposito: um cenario que
  // derruba a rede impediria ate o app de subir para receber o reset.
  await page.goto('/?scenario=default');
  await waitForMocks(page);
  await resetSimulation(page, scenario);
  // Recarrega para a aplicacao partir do estado recem-restaurado.
  await page.goto(path);
  if (waitForBoot) await waitForMocks(page);
}

/**
 * Espera o worker do MSW estar instalado.
 *
 * O app so renderiza depois de `startMocks()`, entao a presenca do esqueleto
 * significa que o service worker ja intercepta — sem essa espera, o reset
 * escaparia para o servidor de desenvolvimento e voltaria 404.
 *
 * @param page - Pagina do teste.
 */
async function waitForMocks(page: Page): Promise<void> {
  // Marcador proprio (e nao papel nem tag): com o painel aberto, o Radix marca
  // o resto da pagina como `aria-hidden`, e o header do design so existe a
  // partir de `md` — o esqueleto do app e o unico marcador presente nos dois
  // viewports em qualquer estado.
  // Prazo folgado de proposito: o primeiro render espera o worker do MSW ser
  // registrado, e com a suite inteira em paralelo esse passo varia bastante.
  await expect(page.getByTestId('app-shell')).toBeAttached({ timeout: APP_BOOT_TIMEOUT_MS });
}

/**
 * Restaura integralmente o cenario informado.
 *
 * @param page - Pagina do teste.
 * @param scenario - Cenario a aplicar.
 */
export async function resetSimulation(page: Page, scenario: TestScenario): Promise<void> {
  await page.evaluate(
    async ([url, id]) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: id }),
      });

      if (!response.ok) throw new Error(`Reset da simulacao falhou: ${String(response.status)}`);
    },
    [CONTROL_PATHS.reset, scenario] as const,
  );
}

/**
 * Troca o cenario ativo sem ressemear os dados.
 *
 * E o que permite testar recuperacao: a tela falha em um cenario, o cenario
 * volta ao saudavel e a nova tentativa passa — sem recarregar a pagina, que
 * mascararia o comportamento do cache.
 *
 * @param page - Pagina do teste.
 * @param scenario - Novo cenario.
 */
export async function switchScenario(page: Page, scenario: TestScenario): Promise<void> {
  await page.evaluate(
    async ([url, id]) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, reseed: false }),
      });

      if (!response.ok) throw new Error(`Troca de cenario falhou: ${String(response.status)}`);
    },
    [CONTROL_PATHS.scenario, scenario] as const,
  );
}

/**
 * Vence todas as sessoes ativas sem esperar o TTL.
 *
 * @param page - Pagina do teste.
 */
export async function expireSessions(page: Page): Promise<void> {
  await waitForMocks(page);
  await page.evaluate(async (url) => {
    const response = await fetch(url, { method: 'POST' });
    if (!response.ok) throw new Error(`Expiracao da sessao falhou: ${String(response.status)}`);
  }, CONTROL_PATHS.expireSession);
}

/**
 * Dispara `nft.updated` no servidor simulado.
 *
 * O evento sai do servidor e chega pelo `socket.io-client`, como em producao —
 * nenhum teste escreve no cache nem chama setter da interface.
 *
 * `version` produz um evento deliberadamente fora de ordem: o servidor nao
 * muda, e o envelope sai com a versao informada — e assim que se exige do
 * cliente o descarte de evento antigo ou reentregue.
 *
 * @param page - Pagina do teste.
 * @param payload - NFT afetado, os novos valores e a versao a declarar.
 */
export async function emitNftUpdate(
  page: Page,
  payload: { nftId: string; price?: string; available?: number; version?: number },
): Promise<void> {
  // A rota so termina de assentar depois que o router resolve preloads; disparar
  // no meio disso derrubaria o contexto de execucao do `evaluate`.
  await page.waitForLoadState('networkidle');

  await page.evaluate(
    async ([url, body]) => {
      const response = await fetch(url as string, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error(`Emissao do evento falhou: ${String(response.status)}`);
    },
    [CONTROL_PATHS.emitNft, payload] as const,
  );
}

/**
 * Coloca itens no carrinho do visitante antes do teste comecar.
 *
 * Fala com a MESMA API que a interface usa (`POST /cart/items`, com o
 * `x-guest-id` que o app ja criou) — nao escreve em storage nem no cache do
 * TanStack Query. E preparacao de cenario, nao o comportamento sob teste:
 * adicionar pela interface tem teste proprio.
 *
 * @param page - Pagina do teste, ja com o worker do MSW instalado.
 * @param items - NFTs e quantidades a incluir.
 */
export async function seedCart(
  page: Page,
  items: readonly { nftId: string; quantity: number }[],
): Promise<void> {
  await expect(page.getByTestId('app-shell')).toBeAttached({ timeout: APP_BOOT_TIMEOUT_MS });

  await page.evaluate(
    async ([url, guestKey, tokenKey, body]) => {
      const guestId = localStorage.getItem(guestKey as string) ?? '';
      // O token entra quando existe: sem ele, um carrinho semeado DEPOIS do
      // login iria parar no carrinho de visitante, e nao no da conta.
      const token = localStorage.getItem(tokenKey as string);

      for (const item of body as { nftId: string; quantity: number }[]) {
        const response = await fetch(url as string, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-guest-id': guestId,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(item),
        });

        if (!response.ok) throw new Error(`Nao foi possivel semear ${item.nftId}.`);
      }
    },
    [
      `${API_BASE_URL}/cart/items`,
      GUEST_ID_STORAGE_KEY,
      SESSION_TOKEN_STORAGE_KEY,
      items,
    ] as const,
  );
}

/**
 * Dispara `order.updated` no servidor simulado.
 *
 * Como no evento de NFT, a transicao acontece NO SERVIDOR e o evento chega pelo
 * `socket.io-client` — nenhum teste escreve no cache nem chama setter da
 * interface. Reenviar o mesmo estado exercita a duplicata; enviar um estado
 * depois de o pedido ja estar terminal exercita a terminalidade (o servidor
 * responde `409` e nada muda).
 *
 * @param page - Pagina do teste.
 * @param payload - Pedido, estado terminal e motivo da recusa.
 * @returns Status HTTP da chamada de controle.
 */
export async function emitOrderUpdate(
  page: Page,
  payload: { orderId: string; status: 'confirmed' | 'declined'; declineReason?: string },
): Promise<number> {
  return page.evaluate(
    async ([url, body]) => {
      const response = await fetch(url as string, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      return response.status;
    },
    [CONTROL_PATHS.emitOrder, payload] as const,
  );
}

/**
 * Le os pedidos do usuario autenticado pela propria API.
 *
 * Serve para o teste afirmar sobre o SERVIDOR (quantos pedidos existem, qual o
 * estado deles) sem depender do que a tela esta mostrando — e assim que se
 * prova que um clique repetido nao criou uma segunda compra.
 *
 * @param page - Pagina do teste, ja autenticada.
 * @returns Pedidos do mais recente para o mais antigo.
 */
export async function readOrders(
  page: Page,
): Promise<{ id: string; status: string; reference: string }[]> {
  return page.evaluate(
    async ([url, key]) => {
      const token = localStorage.getItem(key as string) ?? '';
      const response = await fetch(url as string, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(`Leitura de pedidos falhou: ${String(response.status)}`);
      const body = (await response.json()) as {
        items: { id: string; status: string; reference: string }[];
      };
      return body.items;
    },
    [`${API_BASE_URL}/orders`, SESSION_TOKEN_STORAGE_KEY] as const,
  );
}
