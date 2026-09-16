import type { WalletProvider } from '@/features/wallets/types/wallet';

/**
 * Segmento da query key das carteiras.
 *
 * Mora aqui, na feature dona do recurso, e nao em cada tela que o consome: o
 * pagamento LE as mesmas carteiras que esta tela CADASTRA, e duas strings
 * iguais por coincidencia seriam duas entradas de cache diferentes no dia em
 * que uma delas mudasse. Com a constante compartilhada, invalidar depois de
 * salvar tambem atualiza o pagamento.
 */
export const WALLETS_QUERY_SEGMENT = 'wallets';

/** Provedores aceitos no seletor "Tipo de carteira". */
export const WALLET_PROVIDERS: readonly WalletProvider[] = [
  'metamask',
  'walletconnect',
  'coinbase',
] as const;

/**
 * Type guard do provedor, para o valor vindo de um `select` entrar tipado no
 * corpo da requisicao — sem asercao, que so calaria o compilador.
 *
 * @param value - Valor escolhido no seletor.
 * @returns `true` quando o valor e um provedor conhecido.
 */
export function isWalletProvider(value: string): value is WalletProvider {
  return (WALLET_PROVIDERS as readonly string[]).includes(value);
}

/** Tamanho minimo dos nomes do formulario (espelha a regra do servidor). */
export const MIN_WALLET_NAME_LENGTH = 3;

/** Tamanho minimo do codigo de indicacao (espelha a regra do servidor). */
export const MIN_REFERRAL_CODE_LENGTH = 4;

/** Linhas desenhadas no esqueleto de cada bloco de carteira. */
export const WALLET_SKELETON_FIELDS = 10;
