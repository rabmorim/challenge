import {
  MIN_REFERRAL_CODE_LENGTH,
  MIN_WALLET_NAME_LENGTH,
} from '@/features/wallets/constants/wallets';
import { WALLET_ERRORS } from '@/features/wallets/constants/wallets-copy';
import type {
  WalletFormErrors,
  WalletFormValues,
} from '@/features/wallets/types/wallet-state';
import { isNetworkId } from '@/constants/network';

/**
 * Validacao do formulario de carteira.
 *
 * Repete as regras do servidor de proposito: apontar o erro no campo antes de
 * gastar uma ida a rede. O servidor continua sendo a palavra final — os
 * `fieldErrors` da resposta caem nos mesmos campos, entao uma regra que divirja
 * aqui aparece la, e nao passa despercebida.
 */

/** Formato de endereco aceito (padrao Ethereum, usado tambem nas outras redes). */
const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;

/** Formato de e-mail aceito. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Formato de nome ENS aceito (`rotulo.tld`). */
const ENS_PATTERN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i;

/** Formato aceito para o rotulo do ENS (a parte antes do dominio). */
const ENS_LABEL_PATTERN = /^[a-z0-9-]+$/i;

/**
 * Valida os valores de um bloco de carteira.
 *
 * @param values - Valores digitados, ja com rede e provedor escolhidos.
 * @returns Erros por campo (objeto vazio quando tudo esta valido).
 */
export function validateWalletForm(values: WalletFormValues): WalletFormErrors {
  const errors: WalletFormErrors = {};

  if (values.displayName.trim().length < MIN_WALLET_NAME_LENGTH) {
    errors.displayName = WALLET_ERRORS.displayName;
  }
  if (values.label.trim().length < MIN_WALLET_NAME_LENGTH) errors.label = WALLET_ERRORS.label;
  if (values.profileName.trim().length < MIN_WALLET_NAME_LENGTH) {
    errors.profileName = WALLET_ERRORS.profileName;
  }
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = WALLET_ERRORS.email;
  if (!ADDRESS_PATTERN.test(values.address.trim())) errors.address = WALLET_ERRORS.address;
  if (values.referralCode.trim().length < MIN_REFERRAL_CODE_LENGTH) {
    errors.referralCode = WALLET_ERRORS.referralCode;
  }
  if (!ENS_LABEL_PATTERN.test(values.ensLabel.trim())) errors.ensName = WALLET_ERRORS.ensName;
  if (!isNetworkId(values.network)) errors.network = WALLET_ERRORS.network;
  if (values.provider === '') errors.provider = WALLET_ERRORS.provider;

  // O campo e opcional, mas quando preenchido precisa ser um dos dois formatos
  // que o rotulo promete: endereco 0x ou nome ENS.
  const linked = values.linkedReference.trim();
  if (linked.length > 0 && !ADDRESS_PATTERN.test(linked) && !ENS_PATTERN.test(linked)) {
    errors.linkedReference = WALLET_ERRORS.linkedReference;
  }

  return errors;
}
