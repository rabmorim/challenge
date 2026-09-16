import { expect, test } from '@playwright/test';

import { emitNftUpdate, startApp } from './support/mocks';

/**
 * Cenario 2 do enunciado: acesso direto ao detalhe e tratamento de recurso
 * inexistente — mais os casos que o detalhe precisa cobrir (edicao
 * indisponivel, limite de quantidade) e a chegada de `nft.updated` com a tela
 * aberta.
 */
test.describe('detalhe do NFT', () => {
  test('acesso direto por URL monta a tela com os dados do recurso', async ({ page }) => {
    await startApp(page, 'default', '/nft/emerald-ape-042');

    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible();
    await expect(page.getByTestId('detail-price')).toHaveText('1.19 ETH');
    await expect(page.getByRole('tab', { name: 'Detalhes do NFT' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Mais desta coleção' })).toBeVisible();
  });

  test('o refresh mantem a tela do recurso acessado', async ({ page }) => {
    await startApp(page, 'default', '/nft/emerald-ape-042');

    await page.reload();

    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible();
  });

  test('NFT inexistente cai no estado de nao encontrado, com saida', async ({ page }) => {
    await startApp(page, 'default', '/nft/nao-existe');

    await expect(page.getByTestId('nft-not-found')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'NFT não encontrado' })).toBeVisible();

    await page.getByRole('link', { name: 'Ver o catálogo' }).click();

    await expect(page).toHaveURL(/\/mercado/);
    await expect(page.getByTestId('nft-grid')).toBeVisible();
  });

  test('a galeria troca a arte principal pelas miniaturas', async ({ page, viewport }) => {
    // A coluna de miniaturas e do frame de 1440. O de 414 mostra uma peca so, e
    // a arte abre em tamanho cheio pelo toque na propria imagem.
    test.skip((viewport?.width ?? 0) < 768, 'O frame de 414 nao desenha miniaturas.');

    await startApp(page, 'default', '/nft/emerald-ape-042');

    const thumbs = page.getByRole('button', { name: /^Ver imagem/ });
    await expect(thumbs.first()).toHaveAttribute('aria-pressed', 'true');

    await thumbs.nth(1).click();

    await expect(thumbs.nth(1)).toHaveAttribute('aria-pressed', 'true');
    await expect(thumbs.first()).toHaveAttribute('aria-pressed', 'false');
  });

  test('as bolinhas de "Mais desta colecao" trocam os itens exibidos', async ({ page }) => {
    await startApp(page, 'default', '/nft/emerald-ape-042');

    const cards = page.getByTestId('nft-preview-card');
    const dots = page.getByTestId('carousel-dots').getByRole('button');

    // `digital-art` tem 12 itens semeados: 11 relacionados, 3 paginas de 5.
    await expect(dots).toHaveCount(3);
    await expect(cards).toHaveCount(5);
    await expect(dots.first()).toHaveAttribute('aria-current', 'true');

    const firstPage = await cards.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('data-slug')),
    );

    await dots.nth(1).click();

    await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true');
    await expect(cards).toHaveCount(5);

    const secondPage = await cards.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('data-slug')),
    );

    // Paginas distintas: a bolinha troca os itens, nao so o preenchimento.
    expect(secondPage).not.toEqual(firstPage);
    for (const slug of secondPage) expect(firstPage).not.toContain(slug);

    // A ultima pagina fecha o resto da colecao (11 = 5 + 5 + 1).
    await dots.nth(2).click();
    await expect(cards).toHaveCount(1);
  });

  test('a quantidade respeita o limite da edicao', async ({ page }) => {
    // `emerald-ape-042`: 12 disponiveis, maximo de 3 por pedido.
    await startApp(page, 'default', '/nft/emerald-ape-042');

    const increase = page.getByRole('button', { name: 'Aumentar quantidade' });
    const value = page.getByTestId('quantity-value');

    await expect(value).toHaveValue('1');
    await expect(page.getByRole('button', { name: 'Diminuir quantidade' })).toBeDisabled();

    await increase.click();
    await increase.click();

    await expect(value).toHaveValue('3');
    await expect(increase).toBeDisabled();
  });

  test('edicao esgotada bloqueia a compra e anuncia o motivo', async ({ page }) => {
    // `golden-signal-160` e semeado sem unidades disponiveis.
    await startApp(page, 'default', '/nft/golden-signal-160');

    await expect(page.getByTestId('edition-status')).toHaveText('ESGOTADA');
    await expect(page.getByTestId('buy-button')).toBeDisabled();
    await expect(page.getByTestId('buy-note')).toContainText('Edição indisponível');
  });

  test('comprar sem sessao leva ao painel, e nao a um pedido inventado', async ({ page }) => {
    await startApp(page, 'default', '/nft/emerald-ape-042');

    await page.getByTestId('buy-button').click();

    // Visitante: o caminho verdadeiro e autenticar, nao um "pedido criado".
    // O que o botao faz com sessao (incluir no carrinho) tem teste em
    // `cart.spec.ts`, junto do resto do fluxo.
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Entrar' })).toBeVisible();
    await expect(page.getByTestId('cart-count')).toHaveCount(0);
  });

  test('`nft.updated` atualiza preco e disponibilidade com a tela aberta', async ({ page }) => {
    await startApp(page, 'default', '/nft/emerald-ape-042');

    await expect(page.getByTestId('detail-price')).toHaveText('1.19 ETH');

    // O evento sai do servidor simulado e chega pelo `socket.io-client`.
    await emitNftUpdate(page, { nftId: 'emerald-ape-042', price: '2.50', available: 2 });

    await expect(page.getByTestId('detail-price')).toHaveText('2.50 ETH');

    // O frame nao escreve a disponibilidade: quem responde ao evento e o teto
    // do seletor, que passa a travar na segunda unidade.
    await expect(page.getByTestId('buy-note')).toContainText('2 unidades disponíveis');

    const increase = page.getByRole('button', { name: 'Aumentar quantidade' });
    await increase.click();
    await expect(page.getByTestId('quantity-value')).toHaveValue('2');
    await expect(increase).toBeDisabled();
  });

  test('evento antigo nao regride o estado mais novo', async ({ page }) => {
    await startApp(page, 'default', '/nft/emerald-ape-042');

    await emitNftUpdate(page, { nftId: 'emerald-ape-042', price: '2.50' });
    await expect(page.getByTestId('detail-price')).toHaveText('2.50 ETH');

    // Reemissao do evento corrente: mesma versao, nenhum efeito reaplicado.
    await emitNftUpdate(page, { nftId: 'emerald-ape-042' });

    await expect(page.getByTestId('detail-price')).toHaveText('2.50 ETH');
  });
});
