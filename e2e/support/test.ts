import { test as base } from '@playwright/test';

/**
 * `test` do projeto, com a navegacao resiliente a uma corrida do ambiente.
 *
 * **O que acontece.** A suite roda com tres workers em paralelo e todos
 * compartilham a MESMA origem (`localhost:5173`) — e, com ela, o mesmo registro
 * de service worker do MSW. Cada contexto novo chama `worker.start()` no boot,
 * e quando um registro assume o controle da origem enquanto outro contexto tem
 * uma navegacao de documento em voo, o Chromium cancela essa navegacao com
 * `net::ERR_ABORTED`. O sintoma e sempre o mesmo: um `page.goto` falha sem que
 * nada da aplicacao tenha mudado, e o teste passa 15 de 15 vezes quando o
 * arquivo roda sozinho.
 *
 * **Por que repetir e correto aqui.** `ERR_ABORTED` em navegacao de documento
 * nao e um estado que a aplicacao produza: ela nao chama `location.replace`
 * durante o carregamento, e o TanStack Router navega pela History API, que nao
 * cancela carregamento de documento. Qualquer outro erro de navegacao continua
 * subindo, e as assercoes do teste seguem intactas — nada de falha real fica
 * escondido atras desta repeticao.
 *
 * Fica aqui, e nao em `retries` da configuracao, porque repetir o TESTE INTEIRO
 * mascararia flutuacao de verdade; repetir apenas a navegacao cancelada trata
 * exatamente a corrida conhecida.
 */

/** Trecho da mensagem do Chromium quando a navegacao e cancelada. */
const ABORTED_NAVIGATION = 'net::ERR_ABORTED';

export const test = base.extend({
  page: async ({ page }, use) => {
    const navigate = page.goto.bind(page);

    page.goto = async (url, options) => {
      try {
        return await navigate(url, options);
      } catch (error) {
        if (!String(error).includes(ABORTED_NAVIGATION)) throw error;
        // Segunda e ultima tentativa: o registro concorrente ja assumiu.
        return navigate(url, options);
      }
    };

    await use(page);
  },
});

export { expect } from '@playwright/test';
