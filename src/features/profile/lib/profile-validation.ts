import {
  MIN_PASSWORD_LENGTH,
  MIN_PROFILE_NAME_LENGTH,
  PROFILE_ERRORS,
} from '@/features/profile/constants/profile';
import type {
  ProfileFormErrors,
  ProfileFormValues,
} from '@/features/profile/types/profile-state';

/**
 * Validacao do formulario do perfil.
 *
 * Repete as regras do servidor de proposito: apontar o erro no campo antes de
 * gastar uma ida a rede. O servidor continua sendo a palavra final — os
 * `fieldErrors` da resposta caem nos mesmos campos, entao uma regra que divirja
 * aqui aparece la, e nao passa despercebida.
 */

/** Formato de e-mail aceito. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Formato aceito para o rotulo do ENS (a parte antes do dominio). */
const ENS_LABEL_PATTERN = /^[a-z0-9-]+$/i;

/**
 * Diz se o bloco "Alterar senha" foi preenchido.
 *
 * O frame tem um botao "Salvar" so, para dados e senha. Deixar os tres campos
 * em branco e a forma de dizer "nao quero trocar a senha" — exigir a senha
 * atual para corrigir um nome seria um pedagio sem motivo.
 *
 * @param values - Valores do formulario.
 * @returns `true` quando ao menos um campo de senha tem conteudo.
 */
export function isChangingPassword(values: ProfileFormValues): boolean {
  return (
    values.currentPassword.length > 0 ||
    values.newPassword.length > 0 ||
    values.newPasswordConfirmation.length > 0
  );
}

/**
 * Valida os dados do perfil (a metade de cima do frame).
 *
 * @param values - Valores digitados.
 * @returns Erros por campo (objeto vazio quando tudo esta valido).
 */
export function validateProfileFields(values: ProfileFormValues): ProfileFormErrors {
  const errors: ProfileFormErrors = {};

  if (values.displayName.trim().length < MIN_PROFILE_NAME_LENGTH) {
    errors.displayName = PROFILE_ERRORS.displayName;
  }
  if (values.username.trim().length < MIN_PROFILE_NAME_LENGTH) {
    errors.username = PROFILE_ERRORS.username;
  }
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = PROFILE_ERRORS.email;
  if (values.walletLabel.trim().length < MIN_PROFILE_NAME_LENGTH) {
    errors.walletLabel = PROFILE_ERRORS.walletLabel;
  }
  if (!ENS_LABEL_PATTERN.test(values.ensLabel.trim())) errors.ensName = PROFILE_ERRORS.ensName;

  return errors;
}

/**
 * Valida a troca de senha.
 *
 * So e chamada quando o bloco foi preenchido (`isChangingPassword`): validar
 * campos vazios marcaria em vermelho um formulario que ninguem pediu para
 * enviar.
 *
 * @param values - Valores digitados.
 * @returns Erros por campo.
 */
export function validatePasswordChange(values: ProfileFormValues): ProfileFormErrors {
  const errors: ProfileFormErrors = {};

  if (values.currentPassword.length === 0) errors.currentPassword = PROFILE_ERRORS.currentPassword;
  if (values.newPassword.length < MIN_PASSWORD_LENGTH) {
    errors.newPassword = PROFILE_ERRORS.newPassword;
  } else if (values.newPassword === values.currentPassword) {
    errors.newPassword = PROFILE_ERRORS.newPasswordRepeated;
  }
  if (values.newPassword !== values.newPasswordConfirmation) {
    errors.newPasswordConfirmation = PROFILE_ERRORS.newPasswordConfirmation;
  }

  return errors;
}
