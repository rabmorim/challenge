import { buildPageTitle } from '@/constants/seo';
import type { RouteHead, RouteSeo } from '@/types/seo';

/**
 * Monta o `head` de uma rota: `<title>` e `<meta name="description">`.
 *
 * Existe para que nenhuma rota escreva a estrutura do `meta` na mão — o
 * `<HeadContent />` do TanStack Router aplica o que sai daqui, e um par de
 * chaves fora do formato passaria despercebido até a auditoria.
 *
 * @param seo - Título da tela e descrição correspondente.
 * @returns Objeto aceito pela opção `head` de `createFileRoute`.
 */
export function routeHead(seo: RouteSeo): RouteHead {
  return {
    meta: [{ title: buildPageTitle(seo.title) }, { name: 'description', content: seo.description }],
  };
}
