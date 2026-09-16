import type { AuthTab } from '@/features/auth/types/auth-navigation';
import type { AuthenticatedUser } from '@/features/auth/types/user';

/** Props comuns aos formularios do painel de autenticacao. */
export interface AuthFormProps {
  /** Chamado quando a sessao e aberta com sucesso (fecha o painel e retoma o fluxo). */
  onAuthenticated: () => void;
}

/** Props do painel (conteudo compartilhado entre modal e tela cheia). */
export interface AuthPanelProps extends AuthFormProps {
  /** Aba aberta. */
  tab: AuthTab;
  /** Troca de aba. */
  onTabChange: (tab: AuthTab) => void;
}

/** Props do campo de senha com alternancia de visibilidade. */
export interface PasswordFieldProps {
  /** Id do controle. */
  id: string;
  /** Nome enviado no formulario (casa com `fieldErrors` da API). */
  name: string;
  /** Rotulo do campo. */
  label: string;
  /**
   * Esconde o rotulo visualmente.
   * `true` no painel de autenticacao, onde o frame usa o placeholder no lugar;
   * `false` no perfil, onde o frame escreve o rotulo acima do campo.
   */
  hideLabel?: boolean;
  placeholder?: string;
  value: string;
  /** Trava o campo enquanto o formulario esta em voo. */
  disabled?: boolean;
  /** Erro do campo, quando houver. */
  error?: string | undefined;
  /** Dica de preenchimento do navegador. */
  autoComplete: 'current-password' | 'new-password';
  /** Exibe o olho de mostrar/ocultar. `false` na confirmacao de senha. */
  revealable?: boolean;
  /** Recebe o novo valor digitado. */
  onValueChange: (value: string) => void;
}

/** Props de `FormStatus`. */
export interface FormStatusProps {
  /** Mensagem a anunciar; `null` mantem a regiao vazia. */
  message: string | null;
}

/**
 * Apresentacao dos controles de conta.
 * `full` e a composicao do header de 1440 (rotulo + nome); `icon` e a do
 * frame de 414, onde a barra de atalhos so tem espaco para o glifo.
 */
export type AccountControlVariant = 'full' | 'icon';

/** Props de `AccountMenu`. */
export interface AccountMenuProps {
  /** Usuario da sessao corrente. */
  user: AuthenticatedUser;
  variant?: AccountControlVariant;
}

/** Props de `SignInButton`. */
export interface SignInButtonProps {
  variant?: AccountControlVariant;
}
