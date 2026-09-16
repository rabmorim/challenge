import { describe, expect, it } from 'vitest';

import { login } from '@/features/auth/api/auth-api';
import { addCartItem, fetchCart } from '@/features/cart/api/cart-api';
import { fetchNft, listNfts } from '@/features/catalog/api/nfts-api';
import { httpClient } from '@/lib/http';
import { MOCK_CONTROL_PATHS } from '@/mocks/constants';
import type { ScenarioStateResponse } from '@/mocks/types/control';
import { emitNftEvent, resetScenario, selectScenario } from '@/test/mock-control';

/**
 * Cenarios e condicoes de rede: selecao por endpoint de controle, falhas
 * reproduzíveis, respostas fora de ordem e reset que restaura o estado.
 */
describe('cenarios', () => {
  it('lista os cenarios disponiveis e informa o ativo', async () => {
    const { data } = await httpClient.get<ScenarioStateResponse>(MOCK_CONTROL_PATHS.scenario);

    expect(data.active.id).toBe('default');
    expect(data.available.length).toBeGreaterThanOrEqual(14);
    expect(data.available.map((scenario) => scenario.id)).toContain('order-timeout');
  });

  it('offline derruba a requisicao antes do servidor, sem status', async () => {
    await selectScenario('offline');

    await expect(listNfts({})).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });

  it('mantem o controle acessivel mesmo com a rede derrubada', async () => {
    await selectScenario('offline');
    await expect(listNfts({})).rejects.toMatchObject({ code: 'NETWORK_ERROR' });

    // O controle nao passa pelas condicoes de rede: sem isso, um teste no
    // cenario offline nao conseguiria voltar ao estado normal.
    const state = await selectScenario('default');
    expect(state.active.id).toBe('default');

    const response = await listNfts({});
    expect(response.total).toBe(36);
  });

  it('server-error responde 503 como falha transitoria', async () => {
    await selectScenario('server-error');

    await expect(listNfts({})).rejects.toMatchObject({
      code: 'TRANSIENT_FAILURE',
      status: 503,
    });
  });

  it('flaky falha as duas primeiras tentativas e passa na terceira', async () => {
    await selectScenario('flaky');

    await expect(listNfts({})).rejects.toMatchObject({ code: 'TRANSIENT_FAILURE' });
    await expect(listNfts({})).rejects.toMatchObject({ code: 'TRANSIENT_FAILURE' });

    const recovered = await listNfts({});
    expect(recovered.total).toBe(36);
  });

  it('entrega cada resposta ao seu proprio pedido com latencia variavel', async () => {
    await selectScenario('out-of-order');

    const [first, second, third, fourth] = await Promise.all([
      listNfts({ page: 1 }),
      listNfts({ page: 2 }),
      listNfts({ page: 3 }),
      listNfts({ page: 4 }),
    ]);

    // As respostas podem chegar fora de ordem; cada uma precisa corresponder
    // exatamente ao parametro que a originou.
    expect(first.page).toBe(1);
    expect(second.page).toBe(2);
    expect(third.page).toBe(3);
    expect(fourth.page).toBe(4);
    expect(fourth.totalPages).toBe(4);
  });

  it('reset restaura integralmente o estado semeado', async () => {
    await login({ email: 'ana@kurio.dev', password: 'kurio1234' });
    await addCartItem({ nftId: 'emerald-ape-042', quantity: 1 });
    await emitNftEvent({ nftId: 'emerald-ape-042', price: '9.99', available: 1 });

    const changed = await fetchNft('emerald-ape-042');
    expect(changed.price).toBe('9.99');

    await resetScenario('default');

    const restored = await fetchNft('emerald-ape-042');
    expect(restored).toMatchObject({ price: '1.19', version: 1, previousPrice: null });
    expect(restored.edition.available).toBe(12);

    // A sessao tambem foi semeada de novo: o token anterior nao vale mais.
    await expect(fetchCart()).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
  });
});
