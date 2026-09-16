import { EnsNameField } from '@/components/ens-name-field';
import { FormField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NETWORKS, NETWORK_IDS, isNetworkId } from '@/constants/network';
import { CheckoutSelect } from '@/features/checkout/components/checkout-select';
import type { SelectOption } from '@/features/checkout/types/checkout-components';
import { WALLET_PROVIDER_LABELS } from '@/features/checkout/constants/checkout';
import { WALLET_PROVIDERS } from '@/features/wallets/constants/wallets';
import { WALLETS_COPY } from '@/features/wallets/constants/wallets-copy';
import type { WalletFormProps } from '@/features/wallets/types/wallet-components';

/**
 * Formulário de uma carteira — a grade de dois campos por linha do frame.
 *
 * O mesmo componente desenha os dois blocos: o que muda entre principal e
 * secundária é o papel (que vem do hook) e os ids dos campos, derivados dele
 * para que os dois formulários possam coexistir na página sem que um rótulo
 * aponte para o campo do outro.
 *
 * Duas particularidades do frame viram decisão de implementação:
 *
 * - **"ENS ou carteira secundária" não tem rótulo visível**: o placeholder faz
 *   esse papel. O rótulo continua no DOM (`hideLabel`), porque o campo precisa
 *   de nome acessível, e a célula ganha o recuo da altura de um rótulo para
 *   alinhar com o campo ao lado — sem isso a linha ficaria torta.
 * - **"Nome ENS" é o seletor de domínio mais o rótulo**, editados juntos e
 *   gravados num campo só (ver `EnsNameField`).
 *
 * Nada aqui decide regra: validação, prefill e erros da API vivem em
 * `useWalletForm`. O formulário é `noValidate` porque as mensagens são nossas e
 * ficam associadas aos campos — o balão do navegador competiria com elas.
 *
 * @param props - Estado do bloco e o rótulo acessível do formulário.
 */
export function WalletForm({ form, ariaLabel }: WalletFormProps) {
  const { values, errors, setValue, isSaving, role } = form;
  const prefix = `wallet-${role}`;

  const networkOptions: SelectOption[] = NETWORK_IDS.map((id) => ({
    value: id,
    label: NETWORKS[id].label,
  }));

  const providerOptions: SelectOption[] = WALLET_PROVIDERS.map((provider) => ({
    value: provider,
    label: WALLET_PROVIDER_LABELS[provider],
  }));

  return (
    <form
      noValidate
      data-testid={`${prefix}-form`}
      aria-label={ariaLabel}
      className="flex flex-col gap-6"
      onSubmit={form.submit}
    >
      <div className="grid grid-cols-1 gap-x-7 gap-y-8 md:grid-cols-2">
        <FormField
          id={`${prefix}-display-name`}
          label={WALLETS_COPY.displayName}
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
          id={`${prefix}-label`}
          label={WALLETS_COPY.label}
          isRequired
          error={errors.label}
        >
          {(field) => (
            <Input
              {...field}
              value={values.label}
              disabled={isSaving}
              onChange={(event) => {
                setValue('label', event.target.value);
              }}
            />
          )}
        </FormField>

        <FormField
          id={`${prefix}-network`}
          label={WALLETS_COPY.network}
          isRequired
          error={errors.network}
        >
          {(field) => (
            <CheckoutSelect
              {...field}
              value={values.network}
              options={networkOptions}
              placeholder={WALLETS_COPY.networkPlaceholder}
              disabled={isSaving}
              onChange={(value) => {
                if (isNetworkId(value)) setValue('network', value);
              }}
            />
          )}
        </FormField>

        <FormField
          id={`${prefix}-profile-name`}
          label={WALLETS_COPY.profileName}
          isRequired
          error={errors.profileName}
        >
          {(field) => (
            <Input
              {...field}
              value={values.profileName}
              disabled={isSaving}
              onChange={(event) => {
                setValue('profileName', event.target.value);
              }}
            />
          )}
        </FormField>

        <FormField
          id={`${prefix}-address`}
          label={WALLETS_COPY.address}
          isRequired
          error={errors.address}
        >
          {(field) => (
            <Input
              {...field}
              value={values.address}
              disabled={isSaving}
              placeholder={WALLETS_COPY.addressPlaceholder}
              onChange={(event) => {
                setValue('address', event.target.value);
              }}
            />
          )}
        </FormField>

        {/* Sem rótulo no frame: o recuo repõe a altura que o rótulo ocuparia,
            para o campo alinhar com o "Endereço da carteira" ao lado. */}
        <div className="md:mt-[25px]">
          <FormField
            id={`${prefix}-linked-reference`}
            label={WALLETS_COPY.linkedReference}
            hideLabel
            error={errors.linkedReference}
          >
            {(field) => (
              <Input
                {...field}
                value={values.linkedReference}
                disabled={isSaving}
                placeholder={WALLETS_COPY.linkedReference}
                onChange={(event) => {
                  setValue('linkedReference', event.target.value);
                }}
              />
            )}
          </FormField>
        </div>

        <FormField
          id={`${prefix}-provider`}
          label={WALLETS_COPY.provider}
          isRequired
          error={errors.provider}
        >
          {(field) => (
            <CheckoutSelect
              {...field}
              value={values.provider}
              options={providerOptions}
              placeholder={WALLETS_COPY.providerPlaceholder}
              disabled={isSaving}
              onChange={(value) => {
                setValue('provider', value);
              }}
            />
          )}
        </FormField>

        <FormField
          id={`${prefix}-referral-code`}
          label={WALLETS_COPY.referralCode}
          isRequired
          error={errors.referralCode}
        >
          {(field) => (
            <Input
              {...field}
              value={values.referralCode}
              disabled={isSaving}
              onChange={(event) => {
                setValue('referralCode', event.target.value);
              }}
            />
          )}
        </FormField>

        <FormField
          id={`${prefix}-email`}
          label={WALLETS_COPY.email}
          isRequired
          error={errors.email}
        >
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
          id={`${prefix}-ens-name`}
          label={WALLETS_COPY.ensName}
          textLabel={WALLETS_COPY.ensLabelHint}
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
      </div>

      <Button type="submit" className="w-fit" disabled={isSaving}>
        {isSaving ? WALLETS_COPY.submitting : WALLETS_COPY.submit}
      </Button>
    </form>
  );
}
