import type {
  AvatarControlApi,
  ProfileFormApi,
} from '@/features/profile/types/profile-state';

/** Props dos componentes da tela de perfil. */

/** Props de `ProfileFields` — a grade de dois campos por linha do frame. */
export interface ProfileFieldsProps {
  form: ProfileFormApi;
  avatar: AvatarControlApi;
  /** Nome exibido, usado no texto alternativo do avatar. */
  displayName: string;
  /** Inicial mostrada quando a conta esta sem avatar. */
  avatarInitial: string;
}

/** Props de `AvatarPicker`. */
export interface AvatarPickerProps {
  avatar: AvatarControlApi;
  displayName: string;
  initial: string;
}

/** Props de `PasswordSection` — o bloco "Alterar senha" do frame. */
export interface PasswordSectionProps {
  form: ProfileFormApi;
}
