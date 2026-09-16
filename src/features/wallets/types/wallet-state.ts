import type { FormEvent } from 'react';

import type { Wallet, WalletRole } from '@/features/wallets/types/wallet';
import type { NetworkId } from '@/types/network';
import type { NormalizedHttpError } from '@/types/http';

/** Estado dos controles do formulario de carteira (um por bloco do frame). */
export interface WalletFormValues {
  displayName: string;
  label: string;
  profileName: string;
  email: string;
  referralCode: string;
  address: string;
  /** "ENS ou carteira secundaria (opcional)". */
  linkedReference: string;
  /** Rotulo do nome ENS, sem o dominio. */
  ensLabel: string;
  /** Dominio escolhido no seletor. */
  ensDomain: string;
  /** `''` enquanto nada foi escolhido (o seletor mostra o placeholder). */
  network: NetworkId | '';
  /** `''` enquanto nada foi escolhido. */
  provider: string;
}

/**
 * Erros por campo.
 * As chaves sao as MESMAS do formulario e as mesmas que a API usa em
 * `fieldErrors`. `ensName` entra porque e o nome que o servidor devolve; a
 * interface o exibe no campo do rotulo.
 */
export type WalletFormErrors = Partial<Record<keyof WalletFormValues | 'ensName', string>>;

/** Estado da tela de carteiras mais os dois blocos do frame. */
export interface WalletsApi extends WalletsScreenState {
  primaryForm: WalletFormApi;
  secondaryForm: WalletFormApi;
}

/** Controle de um bloco de carteira, consumido pelo JSX. */
export interface WalletFormApi {
  role: WalletRole;
  values: WalletFormValues;
  errors: WalletFormErrors;
  /** `true` quando o bloco edita uma carteira que ja existe. */
  isEditing: boolean;
  /** `true` enquanto a mutation deste bloco esta em voo. */
  isSaving: boolean;
  /**
   * Atualiza um campo e limpa o erro que o servidor apontou nele.
   *
   * @param field - Campo alterado.
   * @param value - Novo valor.
   */
  setValue: (field: keyof WalletFormValues, value: string) => void;
  /**
   * Valida e envia (cadastro ou atualizacao, conforme o bloco).
   *
   * @param event - Evento de submit do formulario.
   */
  submit: (event: FormEvent<HTMLFormElement>) => void;
}

/** Estado da tela de carteiras, montado pelo hook e consumido pelo JSX. */
export interface WalletsScreenState {
  primary: Wallet | null;
  secondary: Wallet | null;
  isPending: boolean;
  isError: boolean;
  error: NormalizedHttpError | null;
  refetch: () => void;
  /** Mensagem corrente da regiao viva da tela. */
  announcement: string;
  /** `true` quando o bloco da secundaria esta aberto para cadastro. */
  isSecondaryOpen: boolean;
  /** Abre o bloco da secundaria (link "Adicionar" do frame). */
  openSecondary: () => void;
  /**
   * Copia os dados da principal para o rascunho da secundaria.
   * O endereco NAO e copiado (ver `SAME_AS_PRIMARY_HINT`).
   */
  copyFromPrimary: () => void;
  /** `true` quando o atalho "Igual a carteira principal" esta marcado. */
  isSameAsPrimary: boolean;
}
