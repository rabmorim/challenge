import { useSyncExternalStore } from 'react';

import { COMPACT_LAYOUT_QUERY } from '@/constants/layout';

/** `MediaQueryList` compartilhado — um por documento, criado na primeira leitura. */
let compactLayoutQuery: MediaQueryList | null = null;

/**
 * Devolve a consulta de mídia, criando-a uma única vez.
 *
 * @returns A `MediaQueryList` da faixa compacta, ou `null` fora do navegador.
 */
function getCompactLayoutQuery(): MediaQueryList | null {
  if (typeof window === 'undefined') return null;
  compactLayoutQuery ??= window.matchMedia(COMPACT_LAYOUT_QUERY);
  return compactLayoutQuery;
}

/**
 * Assina as mudanças de faixa.
 *
 * @param onChange - Callback do React, disparado quando a faixa muda.
 * @returns Função de limpeza que solta o listener.
 */
function subscribe(onChange: () => void): () => void {
  const query = getCompactLayoutQuery();
  query?.addEventListener('change', onChange);

  return () => {
    query?.removeEventListener('change', onChange);
  };
}

/**
 * Lê a faixa corrente.
 *
 * @returns `true` enquanto a janela está abaixo do breakpoint `md`.
 */
function getSnapshot(): boolean {
  return getCompactLayoutQuery()?.matches ?? false;
}

/**
 * Diz se a tela está na faixa do frame de 414.
 *
 * Vive fora das features porque duas telas dependem dela. Existe porque o
 * detalhe do NFT e o carrinho têm **duas composições** e não duas aparências: o frame de 414 é uma arte sangrada com folha de informações e
 * barra de compra fixa, e o de 1440 é trilha, galeria e painel lado a lado.
 * o carrinho é tabela com resumo ao lado em 1440 e lista de cards com painel de
 * rodapé em 414. Montar as duas e esconder uma com `md:hidden` deixaria a
 * árvore duplicada — dois `h1`, dois seletores de quantidade por item, duas
 * molduras pedindo imagem — então a escolha acontece antes de renderizar, e só
 * uma existe no DOM.
 *
 * A leitura passa por `useSyncExternalStore`: o valor vem direto do
 * `matchMedia` no primeiro render (sem um quadro com o layout errado) e o
 * listener é solto sozinho quando o componente sai.
 *
 * @returns `true` na faixa compacta (abaixo de 768px).
 */
export function useCompactLayout(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
