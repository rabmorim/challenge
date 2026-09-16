import {
  MIN_REFERRAL_CODE_LENGTH,
  MIN_WALLET_NAME_LENGTH,
} from '@/features/wallets/constants/wallets';
import type { WalletRole } from '@/features/wallets/types/wallet';

/**
 * Textos do frame `design/Carteiras.png`.
 *
 * Ficam reunidos aqui (e nao soltos no JSX) porque os mesmos rotulos aparecem
 * nos dois blocos — principal e secundaria — e nos anuncios da regiao viva: uma
 * frase escrita duas vezes e uma frase que vai divergir.
 */

/** Titulo de cada bloco, como o frame escreve. */
export const WALLET_ROLE_TITLES: Record<WalletRole, string> = {
  primary: 'Carteira principal',
  secondary: 'Carteira secundária',
};

/** Textos gerais da tela. */
export const WALLETS_COPY = {
  sectionLabel: 'Carteiras',
  description: 'Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.',

  add: 'Adicionar',
  submit: 'Salvar carteira',
  submitting: 'Salvando…',

  sameAsPrimary: 'Igual à carteira principal',
  emptySecondary: 'Você ainda não adicionou uma carteira secundária.',
  emptyPrimary: 'Você ainda não cadastrou uma carteira principal.',

  loadError: 'Não foi possível carregar suas carteiras.',
  retry: 'Tentar de novo',

  displayName: 'Nome de exibição',
  label: 'Apelido da carteira',
  network: 'Rede',
  networkPlaceholder: 'Selecione uma rede',
  profileName: 'Nome do perfil',
  address: 'Endereço da carteira',
  addressPlaceholder: 'Endereço 0x da carteira',
  linkedReference: 'ENS ou carteira secundária (opcional)',
  provider: 'Tipo de carteira',
  providerPlaceholder: 'Selecione uma carteira',
  referralCode: 'Código de indicação',
  email: 'E-mail',
  ensName: 'Nome ENS',
  ensLabelHint: 'Rótulo do nome ENS',
} as const;

/** Anuncios da regiao viva e dos toasts. */
export const WALLET_MESSAGES = {
  invalid: 'Revise os campos destacados.',
  /**
   * Anuncio do cadastro concluido.
   *
   * @param role - Papel da carteira salva.
   * @returns Texto para a regiao viva.
   */
  created: (role: WalletRole) => `${WALLET_ROLE_TITLES[role]} cadastrada.`,
  /**
   * Anuncio da atualizacao concluida.
   *
   * @param role - Papel da carteira salva.
   * @returns Texto para a regiao viva.
   */
  updated: (role: WalletRole) => `${WALLET_ROLE_TITLES[role]} atualizada.`,
  /**
   * Anuncio da copia dos dados da principal.
   *
   * @returns Texto para a regiao viva.
   */
  copiedFromPrimary:
    'Dados copiados da carteira principal. Informe um endereço diferente para a secundária.',
  /**
   * Falha geral, quando a API nao aponta campo.
   *
   * @param message - Mensagem devolvida pela API.
   * @returns Texto para a regiao viva e o toast.
   */
  failed: (message: string) => `Não foi possível salvar: ${message}`,
} as const;

/** Mensagens de validacao do cliente (as mesmas regras do servidor). */
export const WALLET_ERRORS = {
  displayName: `Informe o nome de exibição (ao menos ${String(MIN_WALLET_NAME_LENGTH)} caracteres).`,
  label: `Informe o apelido da carteira (ao menos ${String(MIN_WALLET_NAME_LENGTH)} caracteres).`,
  profileName: `Informe o nome do perfil (ao menos ${String(MIN_WALLET_NAME_LENGTH)} caracteres).`,
  email: 'Informe um e-mail válido.',
  address: 'Endereço inválido: use 0x seguido de 40 caracteres hexadecimais.',
  linkedReference: 'Informe um endereço 0x ou um nome ENS (ex.: nova.kurio.eth).',
  referralCode: `Informe o código de indicação (ao menos ${String(MIN_REFERRAL_CODE_LENGTH)} caracteres).`,
  ensName: 'Informe o rótulo do nome ENS (ex.: nova).',
  network: 'Escolha a rede da carteira.',
  provider: 'Escolha o tipo de carteira.',
} as const;

/**
 * Explicacao do atalho "Igual a carteira principal".
 *
 * O endereco fica de fora da copia de proposito: o servidor recusa endereco
 * repetido do mesmo dono (`WALLET_ADDRESS_ALREADY_REGISTERED`), entao copia-lo
 * ofereceria um caminho que aparenta funcionar e falha no envio.
 */
export const SAME_AS_PRIMARY_HINT =
  'Copia os dados da carteira principal. O endereço precisa ser diferente.';
