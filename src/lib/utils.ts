import { createCn } from 'cn/config';

/**
 * `cn` — composicao de classes usada pelos primitivos shadcn/ui.
 *
 * A configuracao existe por um motivo concreto: a escala tipografica do KURIO
 * usa nomes proprios (`text-body`, `text-title`...), e o merge padrao os
 * interpreta como COR, por serem `text-*` desconhecidos. O efeito era silencioso
 * e errado — `text-body text-tan` no mesmo elemento descartava o tamanho, e
 * `text-primary-foreground text-body-lg` descartava a cor do texto do botao.
 * Declarar a escala como `font-size` devolve a regra correta: tamanho conflita
 * com tamanho, cor com cor.
 *
 * Os raios nomeados (`rounded-control`, `rounded-button`...) tem o mesmo
 * problema pelo outro lado: o merge padrao nao os reconhece, mantem os dois na
 * string e deixa a ordem do CSS decidir — entao sobrescrever o raio de um
 * primitivo falhava sem erro. Declarados aqui, o ultimo vence, como esperado.
 */
export const cn = createCn({
  extend: {
    classGroups: {
      'font-size': [{ text: ['hero', 'heading', 'title', 'body', 'body-lg', 'facet', 'caption', 'label', 'modal'] }],
      rounded: [{ rounded: ['control', 'button', 'panel', 'card'] }],
    },
  },
});
