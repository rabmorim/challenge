/**
 * Constantes da feature de sessao: abas, campos, limites de validacao e textos.
 *
 * Ficam aqui (e nao no JSX) porque sao contrato: a aba vira valor de URL, o
 * nome do campo casa com `fieldErrors` da API e as mensagens aparecem em mais
 * de um componente. String solta no meio do componente quebraria os tres.
 */

/** Abas do painel de autenticacao. O valor viaja na URL (`?auth=`). */
export const AUTH_TABS = {
  signIn: 'entrar',
  signUp: 'criar-conta',
} as const;

/**
 * Id do subtitulo do painel.
 * O dialogo aponta para ele em `aria-describedby`: o texto muda com a aba, mas
 * so um subtitulo existe no DOM por vez.
 */
export const AUTH_SUBTITLE_ID = 'auth-panel-subtitle';

/** Lista das abas, na ordem em que aparecem no design. */
export const AUTH_TAB_ORDER = [AUTH_TABS.signIn, AUTH_TABS.signUp] as const;

/**
 * Parametros de busca que controlam o painel de autenticacao.
 * Ficam na rota raiz: o painel abre sobre qualquer tela, sobrevive ao refresh e
 * guarda o destino pretendido quando um guard interrompe a navegacao.
 */
export const AUTH_SEARCH_KEYS = {
  /** Aba aberta; ausente = painel fechado. */
  auth: 'auth',
  /** Destino a retomar depois de autenticar. */
  redirect: 'redirect',
} as const;

/**
 * Nomes dos campos dos formularios.
 * Sao os mesmos nomes que a API usa em `fieldErrors`, o que permite mapear erro
 * do servidor para o campo sem tabela de traducao.
 */
export const AUTH_FIELDS = {
  username: 'username',
  email: 'email',
  password: 'password',
  passwordConfirmation: 'passwordConfirmation',
} as const;

/** Limites e formato aceitos na validacao do cliente (espelham o servidor). */
export const AUTH_VALIDATION = {
  minUsernameLength: 3,
  minPasswordLength: 8,
  /** Formato minimo de e-mail — a validacao definitiva e a da API. */
  emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

/** Mensagens de validacao do cliente. */
export const AUTH_VALIDATION_MESSAGES = {
  usernameRequired: 'Informe um nome de usuário.',
  usernameTooShort: `Use ao menos ${String(AUTH_VALIDATION.minUsernameLength)} caracteres.`,
  emailRequired: 'Informe seu e-mail.',
  emailInvalid: 'Informe um e-mail válido.',
  passwordRequired: 'Informe sua senha.',
  passwordTooShort: `A senha precisa de ao menos ${String(AUTH_VALIDATION.minPasswordLength)} caracteres.`,
  passwordConfirmationRequired: 'Confirme a senha.',
  passwordsDoNotMatch: 'As senhas não conferem.',
  /** Resumo anunciado quando o erro ja esta marcado campo a campo. */
  formInvalid: 'Verifique os campos destacados.',
} as const;

/** Textos do painel de autenticacao (DESIGN_SPEC §5 + design/Login.png). */
export const AUTH_COPY = {
  brand: 'KURIO',
  close: 'Fechar',
  dialogTitle: 'Acesso à conta Kurio',
  tabs: {
    [AUTH_TABS.signIn]: 'Entrar',
    [AUTH_TABS.signUp]: 'Criar conta',
  },
  signIn: {
    subtitle: 'Entre para gerenciar sua carteira, coleção e perfil de criador.',
    emailLabel: 'E-mail',
    emailPlaceholder: 'contato@email.com',
    passwordLabel: 'Senha',
    passwordPlaceholder: 'Sua senha',
    forgotPassword: 'Esqueceu a senha?',
    submit: 'Entrar',
    submitting: 'Entrando...',
    success: 'Sessão iniciada.',
  },
  signUp: {
    subtitle: 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.',
    usernameLabel: 'Nome de usuário',
    usernamePlaceholder: 'Nome de usuário',
    emailLabel: 'E-mail',
    emailPlaceholder: 'Digite seu e-mail',
    passwordLabel: 'Senha',
    passwordPlaceholder: 'Senha',
    passwordConfirmationLabel: 'Confirmar senha',
    passwordConfirmationPlaceholder: 'Confirmar senha',
    submit: 'Criar conta',
    submitting: 'Criando conta...',
    success: 'Conta criada.',
  },
  social: {
    divider: 'Ou continue com',
    google: 'Continuar com Google',
    facebook: 'Continuar com Facebook',
  },
  showPassword: 'Mostrar senha',
  hidePassword: 'Ocultar senha',
} as const;

/**
 * Avisos de funcionalidades fora do escopo do desafio.
 * O enunciado e explicito: acao fora do escopo nao pode aparentar sucesso —
 * entao elas avisam que estao indisponiveis em vez de simular autenticacao.
 */
export const AUTH_UNAVAILABLE_MESSAGES = {
  google: 'Entrar com Google não faz parte desta demonstração.',
  facebook: 'Entrar com Facebook não faz parte desta demonstração.',
  passwordRecovery: 'A recuperação de senha não faz parte desta demonstração.',
} as const;

/** Mensagens do ciclo de vida da sessao. */
export const SESSION_MESSAGES = {
  expired: 'Sua sessão expirou. Entre novamente para continuar.',
  invalid: 'Sua sessão não é mais válida. Entre novamente.',
  loggedOut: 'Você saiu da sua conta.',
} as const;

/** Rotulos do menu da conta autenticada. */
export const ACCOUNT_MENU_COPY = {
  trigger: 'Minha conta',
  profile: 'Meu perfil',
  signOut: 'Sair',
  signingOut: 'Saindo...',
} as const;
