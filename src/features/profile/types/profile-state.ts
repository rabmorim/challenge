import type { FormEvent } from 'react';

import type { CollectorProfile } from '@/features/profile/types/profile';
import type { NormalizedHttpError } from '@/types/http';

/** Estado dos controles do formulario "Perfil do colecionador". */
export interface ProfileFormValues {
  displayName: string;
  username: string;
  email: string;
  /** Rotulo do nome ENS, sem o dominio (ex.: `ana`). */
  ensLabel: string;
  /** Dominio escolhido no seletor (ex.: `.eth`). */
  ensDomain: string;
  walletLabel: string;
  currentPassword: string;
  newPassword: string;
  newPasswordConfirmation: string;
}

/**
 * Erros por campo.
 * As chaves sao as MESMAS do formulario e as mesmas que a API usa em
 * `fieldErrors` — e o que permite mapear erro do servidor sem tabela de
 * traducao. `ensName` aparece aqui (e nao `ensLabel`) porque e o nome que o
 * servidor devolve; a interface o exibe no campo do rotulo.
 */
export type ProfileFormErrors = Partial<
  Record<keyof ProfileFormValues | 'ensName' | 'form', string>
>;

/** Controle do formulario do perfil, consumido pelo JSX. */
export interface ProfileFormApi {
  values: ProfileFormValues;
  errors: ProfileFormErrors;
  /** `true` enquanto alguma das mutations do "Salvar" esta em voo. */
  isSaving: boolean;
  /** Mensagem corrente da regiao viva da tela. */
  announcement: string;
  /**
   * Atualiza um campo e limpa o erro que o servidor apontou nele.
   *
   * @param field - Campo alterado.
   * @param value - Novo valor.
   */
  setValue: (field: keyof ProfileFormValues, value: string) => void;
  /**
   * Valida e envia o que mudou.
   *
   * @param event - Evento de submit do formulario.
   */
  submit: (event: FormEvent<HTMLFormElement>) => void;
}

/** Estado da tela de perfil, montado pelo hook e consumido pelo JSX. */
export interface ProfileScreenState {
  profile: CollectorProfile | undefined;
  isPending: boolean;
  isError: boolean;
  error: NormalizedHttpError | null;
  refetch: () => void;
  form: ProfileFormApi;
}

/** Controle do bloco de avatar. */
export interface AvatarControlApi {
  /** URL exibida: a previa local enquanto salva, ou a do perfil. */
  previewUrl: string;
  /** `true` enquanto a troca ou a remocao esta em voo. */
  isPending: boolean;
  /** `true` quando a acao em voo e a remocao (muda o rotulo do botao). */
  isRemoving: boolean;
  /** Erro de tipo/tamanho do arquivo escolhido, antes de qualquer requisicao. */
  error: string | null;
  /**
   * Le o arquivo escolhido e envia.
   *
   * @param file - Arquivo do input, ou `null` quando o usuario cancelou.
   */
  select: (file: File | null) => void;
  /** Remove o avatar da conta. */
  remove: () => void;
}
