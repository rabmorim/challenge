import { EnsNameField } from '@/components/ens-name-field';
import { FormField } from '@/components/form-field';
import { Input } from '@/components/ui/input';
import { AvatarPicker } from '@/features/profile/components/avatar-picker';
import { PROFILE_COPY } from '@/features/profile/constants/profile';
import type { ProfileFieldsProps } from '@/features/profile/types/profile-components';

/**
 * Dados do colecionador — a grade de duas colunas do frame.
 *
 * A ordem das células reproduz o frame exatamente: nome de exibição / nome de
 * usuário, e-mail / nome ENS, apelido da carteira / avatar. Em telas estreitas
 * a grade cai para uma coluna e a ordem de leitura continua a mesma, que é a
 * ordem do DOM — nenhuma célula é reposicionada por CSS, então o que o teclado
 * percorre é o que se vê.
 *
 * @param props - Formulário, controle de avatar e os dados de exibição dele.
 */
export function ProfileFields({ form, avatar, displayName, avatarInitial }: ProfileFieldsProps) {
  const { values, errors, setValue, isSaving } = form;

  return (
    <div className="grid grid-cols-1 gap-x-7 gap-y-8 md:grid-cols-2">
      <FormField
        id="profile-display-name"
        label={PROFILE_COPY.displayName}
        isRequired
        error={errors.displayName}
      >
        {(field) => (
          <Input
            {...field}
            value={values.displayName}
            disabled={isSaving}
            autoComplete="name"
            onChange={(event) => {
              setValue('displayName', event.target.value);
            }}
          />
        )}
      </FormField>

      <FormField
        id="profile-username"
        label={PROFILE_COPY.username}
        isRequired
        error={errors.username}
      >
        {(field) => (
          <Input
            {...field}
            value={values.username}
            disabled={isSaving}
            autoComplete="username"
            onChange={(event) => {
              setValue('username', event.target.value);
            }}
          />
        )}
      </FormField>

      <FormField id="profile-email" label={PROFILE_COPY.email} isRequired error={errors.email}>
        {(field) => (
          <Input
            {...field}
            type="email"
            value={values.email}
            disabled={isSaving}
            autoComplete="email"
            onChange={(event) => {
              setValue('email', event.target.value);
            }}
          />
        )}
      </FormField>

      <EnsNameField
        id="profile-ens-name"
        label={PROFILE_COPY.ensName}
        textLabel={PROFILE_COPY.ensLabelHint}
        labelValue={values.ensLabel}
        domainValue={values.ensDomain}
        error={errors.ensName}
        disabled={isSaving}
        onLabelChange={(value) => {
          setValue('ensLabel', value);
        }}
        onDomainChange={(value) => {
          setValue('ensDomain', value);
        }}
      />

      <FormField
        id="profile-wallet-label"
        label={PROFILE_COPY.walletLabel}
        isRequired
        error={errors.walletLabel}
      >
        {(field) => (
          <Input
            {...field}
            value={values.walletLabel}
            disabled={isSaving}
            onChange={(event) => {
              setValue('walletLabel', event.target.value);
            }}
          />
        )}
      </FormField>

      <AvatarPicker avatar={avatar} displayName={displayName} initial={avatarInitial} />
    </div>
  );
}
