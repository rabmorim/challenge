/**
 * Item da navegação principal.
 * `to` nulo marca um destino fora do escopo da entrega: o item aparece, mas
 * avisa em vez de navegar para uma tela que não existe.
 */
export interface NavItem {
  label: string;
  to: string | null;
  /** `true` quando o item só fica ativo na correspondência exata da rota. */
  exact: boolean;
}

/** Glifos da barra de atalhos do celular, na ordem do frame de 414. */
export type MobileNavIconId = 'home' | 'favorites' | 'cart';

/**
 * Item da barra de atalhos do celular.
 * Diferente do menu do desktop, todo item aqui tem destino: a barra é a única
 * navegação da tela em celulares.
 */
export interface MobileNavItem {
  label: string;
  to: string;
  exact: boolean;
  /** Chave do glifo; o componente é quem resolve o desenho. */
  icon: MobileNavIconId;
}

/**
 * Retorno pelo histórico, usado pelas telas que desenham uma seta de voltar
 * (detalhe do NFT e carrinho no frame de 414).
 */
export interface BackNavigation {
  /** `false` quando a tela foi aberta direto pela URL. */
  canGoBack: boolean;
  goBack: () => void;
}
