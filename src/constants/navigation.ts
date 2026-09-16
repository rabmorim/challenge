import { ROUTES, ROUTE_IDS } from '@/constants/routes';
import type { MobileNavItem, NavItem } from '@/types/navigation';

/** Rótulo acessível da navegação principal. */
export const NAV_LABEL = 'Navegação principal';

/** Rótulo acessível da navegação do rodapé da tela em celulares. */
export const MOBILE_NAV_LABEL = 'Atalhos do colecionador';

/**
 * Rotas cujo frame de 414 não desenha a barra de atalhos do rodapé.
 *
 * O detalhe do NFT é a primeira: ali o rodapé pertence à barra de compra
 * (`BuyBar`), e as duas empilhadas cobririam metade da tela. O pagamento é a
 * segunda, pelo mesmo motivo: o frame "Pagamento com carteira" termina no
 * "Confirmar compra", e a barra passaria por cima do CTA — além de oferecer
 * saídas laterais no meio de um checkout. Esconder a navegação não deixa
 * ninguém preso: a seta de voltar da própria tela é o caminho de saída
 * desenhado nos dois frames.
 */
export const ROUTES_WITHOUT_MOBILE_NAV: readonly string[] = [
  ROUTES.nftDetail,
  ROUTE_IDS.checkout,
];

/** Rótulo do atalho central da barra de celulares. */
export const MOBILE_NAV_EXPLORE_LABEL = 'Explorar o mercado';

/**
 * Destinos da barra de atalhos do celular, na ordem do frame de 414.
 *
 * O quarto glifo do frame (a pessoa) não está aqui porque não é um destino
 * fixo: é o controle de conta (`AccountShortcut`), que abre o painel de
 * autenticação para visitante e o menu da conta com sessão.
 *
 * O glifo fica no componente (constante não importa React); aqui mora o que é
 * dado: rótulo, destino e se a rota casa por igualdade exata.
 */
export const MOBILE_NAV_ITEMS: readonly MobileNavItem[] = [
  { label: 'Início', to: ROUTES.home, exact: true, icon: 'home' },
  { label: 'Favoritos', to: ROUTES.favorites, exact: false, icon: 'favorites' },
  { label: 'Carrinho', to: ROUTES.cart, exact: false, icon: 'cart' },
] as const;

/**
 * Itens do menu do design.
 *
 * "Criadores" e "Aprenda" ficam sem destino porque são páginas editoriais, que
 * o enunciado §3 exclui da entrega. Continuam visíveis (o header é o do Figma) e
 * dizem o que são ao serem acionadas — linkar para uma tela inexistente seria
 * fluxo apenas visual.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Início', to: ROUTES.home, exact: true },
  { label: 'Mercado', to: ROUTES.marketplace, exact: false },
  { label: 'Criadores', to: null, exact: false },
  { label: 'Aprenda', to: null, exact: false },
] as const;

/**
 * Aviso das ações fora do escopo da entrega.
 *
 * @param label - Nome do item acionado.
 * @returns Mensagem exibida no toast.
 */
export function OUT_OF_SCOPE_NOTICE(label: string): string {
  return `"${label}" é uma página editorial e não faz parte desta demonstração.`;
}
