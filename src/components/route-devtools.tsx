import { Suspense, lazy } from 'react';

import { ENV } from '@/constants/env';

/**
 * Devtools do TanStack Router e do TanStack Query.
 * Carregados sob demanda e apenas em desenvolvimento — em producao o
 * componente devolve `null` e o chunk nunca chega ao navegador.
 */
const RouterDevtools = lazy(async () => {
  const { TanStackRouterDevtools } = await import('@tanstack/react-router-devtools');
  return { default: TanStackRouterDevtools };
});

const QueryDevtools = lazy(async () => {
  const { ReactQueryDevtools } = await import('@tanstack/react-query-devtools');
  return { default: ReactQueryDevtools };
});

/**
 * Monta os painels de inspecao em desenvolvimento.
 *
 * Ficam de fora quando o navegador esta sendo dirigido por automacao
 * (`navigator.webdriver`): os gatilhos flutuantes ocupam os cantos inferiores,
 * onde a barra de atalhos do celular desenha os proprios controles, e roubariam
 * o clique dos testes. Nao e simplificacao para passar teste — o painel nao faz
 * parte do produto, e quem abre a Inicio no navegador continua com ele.
 *
 * @returns Os devtools em `vite dev`; `null` em qualquer outro ambiente.
 */
export function RouteDevtools() {
  if (!ENV.isDev || navigator.webdriver) return null;

  return (
    <Suspense fallback={null}>
      <RouterDevtools position="bottom-right" />
      <QueryDevtools buttonPosition="bottom-left" initialIsOpen={false} />
    </Suspense>
  );
}
