import { ROUTES } from '@/constants/routes';
import type { AccountNavItem } from '@/types/account';

/**
 * Navegacao "Meu perfil" — a barra lateral dos frames
 * `design/Perfil do Colecionador.png` e `design/Carteiras.png`.
 *
 * Fica no escopo global (e nao dentro da feature de perfil) porque as duas
 * features que ela liga — perfil e carteiras — a consomem: guardar a lista
 * dentro de uma delas faria a outra depender de sua vizinha para saber navegar.
 */

/** Glifos da barra lateral, na ordem do frame. */
export type AccountNavIconId =
  | 'profile'
  | 'wallets'
  | 'activity'
  | 'watchlist'
  | 'offers'
  | 'downloads'
  | 'support';

/** Titulo da barra lateral, como no frame. */
export const ACCOUNT_NAV_TITLE = 'Meu perfil';

/** Rotulo acessivel da navegacao da conta. */
export const ACCOUNT_NAV_LABEL = 'Seções da minha conta';

/**
 * Secoes da conta, na ordem do frame.
 *
 * Cinco delas nao tem destino: atividade, lista de interesse, ofertas, arquivos
 * baixados e suporte estao explicitamente fora da entrega (enunciado §3). Elas
 * continuam no frame porque a barra e a do design — o que muda e o
 * comportamento, que avisa em vez de simular uma tela.
 */
export const ACCOUNT_NAV_ITEMS: readonly AccountNavItem[] = [
  { label: 'Dados do perfil', to: ROUTES.profile, icon: 'profile' },
  { label: 'Carteiras', to: ROUTES.wallets, icon: 'wallets' },
  { label: 'Atividade', to: null, icon: 'activity' },
  { label: 'Lista de interesse', to: null, icon: 'watchlist' },
  { label: 'Ofertas', to: null, icon: 'offers' },
  { label: 'Arquivos baixados', to: null, icon: 'downloads' },
  { label: 'Suporte', to: null, icon: 'support' },
] as const;

/** Rotulo do item que encerra a sessao (ultimo do frame, fora da lista acima). */
export const ACCOUNT_SIGN_OUT_LABEL = 'Sair';

/** Rotulo do item enquanto o logout esta em voo. */
export const ACCOUNT_SIGNING_OUT_LABEL = 'Saindo…';

/** Selo que marca visualmente uma secao indisponivel — estado nao so por cor. */
export const ACCOUNT_SOON_BADGE = 'em breve';

/**
 * Aviso de uma secao fora do escopo da entrega.
 *
 * @param label - Nome da secao acionada.
 * @returns Mensagem exibida no toast.
 */
export function ACCOUNT_OUT_OF_SCOPE_NOTICE(label: string): string {
  return `"${label}" não faz parte desta demonstração — nenhuma alteração foi feita.`;
}

/**
 * Rotulo do resumo do menu recolhido no celular.
 *
 * @param section - Nome da secao aberta.
 * @returns Texto do `summary`.
 */
export function ACCOUNT_NAV_SUMMARY(section: string): string {
  return `${ACCOUNT_NAV_TITLE} · ${section}`;
}
