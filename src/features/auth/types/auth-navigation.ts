import type { AUTH_TABS } from '@/features/auth/constants/auth';
import type { SessionState } from '@/features/auth/types/session-state';

/** Aba aberta no painel de autenticacao. */
export type AuthTab = (typeof AUTH_TABS)[keyof typeof AUTH_TABS];

/**
 * Parametros de busca da rota raiz que controlam o painel de autenticacao.
 * Estado na URL para que o painel sobreviva ao refresh e ao historico, e para
 * que o guard consiga levar o destino pretendido junto com o redirecionamento.
 */
export interface AuthSearch {
  /** Aba aberta; ausente significa painel fechado. */
  auth?: AuthTab;
  /** Caminho interno a retomar depois de autenticar. */
  redirect?: string;
}

/** Entrada do guard de rota privada. */
export interface RequireAuthParams {
  /** Estado da sessao resolvido no `beforeLoad` da raiz. */
  session: SessionState;
  /** Caminho completo (com busca) da rota que exigiu autenticacao. */
  href: string;
}

/** Controle do painel de autenticacao exposto pelo hook de navegacao. */
export interface AuthPanelController {
  /** `true` quando o painel esta aberto. */
  isOpen: boolean;
  /** Aba corrente (vale mesmo com o painel fechado, para animacao de saida). */
  tab: AuthTab;
  /** Destino a retomar apos autenticar, ja validado como interno. */
  redirectTo: string | null;
  /** Abre o painel na aba informada. */
  open: (tab: AuthTab) => void;
  /** Troca de aba preservando o destino pretendido. */
  selectTab: (tab: AuthTab) => void;
  /** Fecha o painel e limpa os parametros de autenticacao da URL. */
  close: () => void;
  /** Fecha o painel e retoma o destino pretendido, quando houver. */
  finish: () => void;
}
