import { COLLECTOR_ERRORS } from '@/features/checkout/constants/checkout-copy';
import { MAX_COLLECTOR_NOTE_LENGTH } from '@/features/checkout/constants/checkout';
import type {
  CollectorFormErrors,
  CollectorFormValues,
} from '@/features/checkout/types/checkout-state';
import { isNetworkId } from '@/constants/network';

/**
 * Validacao do formulario do colecionador.
 *
 * Repete as regras do servidor de proposito, e nao por acidente: o objetivo e
 * apontar o erro no campo antes de gastar uma ida a rede. O servidor continua
 * sendo a palavra final — os `fieldErrors` da resposta entram nos mesmos campos
 * (ver `applyServerErrors`), entao uma regra que divirja aqui aparece la, e nao
 * passa despercebida.
 */

/** Tamanho minimo dos nomes do formulario. */
const MIN_NAME_LENGTH = 3;

/** Tamanho minimo do codigo de indicacao. */
const MIN_REFERRAL_LENGTH = 4;

/** Formato de endereco aceito (padrao Ethereum, usado tambem nas outras redes). */
const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;

/** Formato de e-mail aceito. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Formato de nome ENS aceito (`rotulo.tld`). */
const ENS_PATTERN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i;

/**
 * Valida os valores do formulario.
 *
 * @param values - Valores digitados, ja com rede e provedor escolhidos.
 * @returns Erros por campo (objeto vazio quando tudo esta valido).
 */
export function validateCollectorForm(values: CollectorFormValues): CollectorFormErrors {
  const errors: CollectorFormErrors = {};

  if (values.displayName.trim().length < MIN_NAME_LENGTH) {
    errors.displayName = COLLECTOR_ERRORS.displayName;
  }
  if (values.username.trim().length < MIN_NAME_LENGTH) errors.username = COLLECTOR_ERRORS.username;
  if (values.profileName.trim().length < MIN_NAME_LENGTH) {
    errors.profileName = COLLECTOR_ERRORS.profileName;
  }
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = COLLECTOR_ERRORS.email;
  if (!ADDRESS_PATTERN.test(values.walletAddress.trim())) {
    errors.walletAddress = COLLECTOR_ERRORS.walletAddress;
  }
  if (values.referralCode.trim().length < MIN_REFERRAL_LENGTH) {
    errors.referralCode = COLLECTOR_ERRORS.referralCode;
  }
  if (!values.ensDomain.startsWith('.')) errors.ensDomain = COLLECTOR_ERRORS.ensDomain;
  if (!isNetworkId(values.network)) errors.network = COLLECTOR_ERRORS.network;
  if (values.walletProvider === '') errors.walletProvider = COLLECTOR_ERRORS.walletProvider;

  const secondary = values.secondaryWallet?.trim() ?? '';
  if (secondary.length > 0 && !ADDRESS_PATTERN.test(secondary) && !ENS_PATTERN.test(secondary)) {
    errors.secondaryWallet = COLLECTOR_ERRORS.secondaryWallet;
  }

  if ((values.note?.length ?? 0) > MAX_COLLECTOR_NOTE_LENGTH) {
    errors.note = COLLECTOR_ERRORS.note;
  }

  return errors;
}

/**
 * Normaliza os campos opcionais antes de enviar.
 * Campo em branco vira `null` — o contrato distingue "nao informado" de "texto
 * vazio", e enviar `""` mudaria a impressao digital do corpo sem mudar nada de
 * fato, o que rotacionaria a chave de idempotencia sem motivo.
 *
 * @param value - Texto digitado pelo usuario.
 * @returns Texto aparado, ou `null` quando vazio.
 */
export function toOptionalText(value: string | null): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}
