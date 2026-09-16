/**
 * Constantes da tela "Perfil do colecionador".
 *
 * Rotulos, mensagens e limites ficam aqui (e nao no JSX) porque sao contrato: o
 * nome do campo casa com `fieldErrors` da API, e os mesmos textos aparecem no
 * formulario, nos anuncios da regiao viva e nos testes.
 */

/** Segmento da query key do perfil, no ramo privado do dono. */
export const PROFILE_QUERY_SEGMENT = 'profile';

/** Tamanho minimo dos nomes do formulario (espelha a regra do servidor). */
export const MIN_PROFILE_NAME_LENGTH = 3;

/** Tamanho minimo de senha aceito (espelha `MIN_PASSWORD_LENGTH` do servidor). */
export const MIN_PASSWORD_LENGTH = 8;

/** Tamanho maximo do arquivo de avatar aceito pelo seletor (2 MB). */
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

/** Tipos de imagem aceitos no seletor de avatar. */
export const ACCEPTED_AVATAR_TYPES = 'image/png,image/jpeg,image/webp';

/** Campos desenhados no esqueleto enquanto o perfil carrega. */
export const PROFILE_SKELETON_FIELDS = 5;

/** Textos do frame `design/Perfil do Colecionador.png`. */
export const PROFILE_COPY = {
  title: 'Perfil do colecionador',
  sectionLabel: 'Dados do perfil',

  displayName: 'Nome de exibição',
  username: 'Nome de usuário',
  email: 'E-mail',
  ensName: 'Nome ENS',
  ensLabelHint: 'Rótulo do nome ENS',
  walletLabel: 'Apelido da carteira',

  avatarTitle: 'Avatar',
  avatarChange: 'Alterar',
  avatarRemove: 'Remover',
  avatarSaving: 'Enviando…',
  avatarRemoving: 'Removendo…',
  /**
   * Texto alternativo do avatar em uso.
   *
   * @param displayName - Nome exibido do colecionador.
   * @returns Alternativa descritiva da imagem.
   */
  avatarAlt: (displayName: string) => `Avatar de ${displayName}`,

  passwordTitle: 'Alterar senha',
  currentPassword: 'Senha atual',
  newPassword: 'Nova senha',
  newPasswordConfirmation: 'Confirmar nova senha',

  submit: 'Salvar',
  submitting: 'Salvando…',

  loadError: 'Não foi possível carregar seu perfil.',
  retry: 'Tentar de novo',
} as const;

/** Anuncios da regiao viva e dos toasts da tela. */
export const PROFILE_MESSAGES = {
  saved: 'Dados do perfil salvos.',
  passwordChanged: 'Senha alterada.',
  savedWithPassword: 'Dados do perfil e senha salvos.',
  avatarSaved: 'Avatar atualizado.',
  avatarRemoved: 'Avatar removido.',
  invalid: 'Revise os campos destacados.',
  unknownFailure: 'Não foi possível salvar. Tente de novo em instantes.',
  /**
   * Falha geral de uma mutation, quando a API nao aponta campo.
   *
   * @param message - Mensagem devolvida pela API.
   * @returns Texto para a regiao viva e o toast.
   */
  failed: (message: string) => `Não foi possível salvar: ${message}`,
} as const;

/** Mensagens de validacao do cliente (as mesmas regras do servidor). */
export const PROFILE_ERRORS = {
  displayName: `Informe o nome de exibição (ao menos ${String(MIN_PROFILE_NAME_LENGTH)} caracteres).`,
  username: `Informe o nome de usuário (ao menos ${String(MIN_PROFILE_NAME_LENGTH)} caracteres).`,
  email: 'Informe um e-mail válido.',
  ensName: 'Informe o rótulo do nome ENS (ex.: ana).',
  walletLabel: `Informe o apelido da carteira (ao menos ${String(MIN_PROFILE_NAME_LENGTH)} caracteres).`,

  currentPassword: 'Informe a senha atual para trocá-la.',
  newPassword: `A nova senha precisa de ao menos ${String(MIN_PASSWORD_LENGTH)} caracteres.`,
  newPasswordRepeated: 'A nova senha precisa ser diferente da atual.',
  newPasswordConfirmation: 'As senhas não conferem.',

  avatarType: 'Escolha uma imagem PNG, JPEG ou WebP.',
  avatarSize: 'A imagem precisa ter no máximo 2 MB.',
} as const;
