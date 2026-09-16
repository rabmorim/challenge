import type { IsoDateTime } from '@/types/api';
import type { NetworkId } from '@/types/network';

/** Provedores de carteira simulados (os do rodape do layout). */
export type WalletProvider = 'metamask' | 'walletconnect' | 'coinbase';

/** Papel da carteira: o layout preve uma principal e uma secundaria. */
export type WalletRole = 'primary' | 'secondary';

/**
 * Estado da conexao simulada.
 * `refused` representa o usuario negando a conexao na extensao.
 */
export type WalletConnectionStatus = 'connected' | 'disconnected' | 'refused';

/**
 * Dados de cadastro que o frame `design/Carteiras.png` pede.
 *
 * Ficam num tipo proprio porque o cadastro e a atualizacao usam o mesmo
 * conjunto (um exigindo tudo, outro parcial) e o recurso publicado os carrega
 * inteiros — descrever o formulario uma vez so impede que as tres formas
 * divirjam quando um campo entrar ou sair do layout.
 */
export interface WalletProfileFields {
  /** "Nome de exibicao" — como o colecionador assina esta carteira. */
  displayName: string;
  /** "Apelido da carteira", ex.: "Principal". */
  label: string;
  /** "Nome do perfil" associado a carteira. */
  profileName: string;
  /** "E-mail" de contato vinculado a carteira. */
  email: string;
  /** "Codigo de indicacao". */
  referralCode: string;
  /** "Tipo de carteira". */
  provider: WalletProvider;
  /** "Rede". */
  network: NetworkId;
  /** "Endereco da carteira" (`0x...`); a interface exibe mascarado. */
  address: string;
  /**
   * Nome ENS associado, quando a carteira tem um.
   * O frame de 414 exibe o nome no lugar do endereco quando ele existe — e
   * mais legivel que `0x...` e e o que identifica a carteira para o usuario.
   * No formulario ele e editado em dois controles (ver `lib/ens-name.ts`).
   */
  ensName: string | null;
  /**
   * "ENS ou carteira secundaria (opcional)" — a referencia livre que o frame
   * coloca ao lado do endereco. E so um apontamento declarado pelo usuario:
   * nao cria nem vincula outra carteira.
   */
  linkedReference: string | null;
}

/** Carteira cadastrada pelo colecionador. */
export interface Wallet extends WalletProfileFields {
  id: string;
  role: WalletRole;
  status: WalletConnectionStatus;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

/** Corpo do cadastro de carteira — todos os campos do frame sao exigidos. */
export interface CreateWalletRequest extends WalletProfileFields {
  role: WalletRole;
}

/** Corpo da atualizacao de carteira (PATCH parcial). */
export interface UpdateWalletRequest extends Partial<WalletProfileFields> {
  role?: WalletRole;
  /** Permite simular conexao, recusa e desconexao. */
  status?: WalletConnectionStatus;
}

/** Lista de carteiras do usuario autenticado. */
export interface WalletsResponse {
  items: Wallet[];
}
