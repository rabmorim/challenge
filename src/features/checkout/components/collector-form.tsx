import { FormField } from '@/components/form-field';
import { Input } from '@/components/ui/input';
import { FOCUS_RING_CLASS } from '@/constants/a11y';
import { ENS_DOMAIN_OPTIONS } from '@/constants/ens';
import { NETWORKS, NETWORK_IDS } from '@/constants/network';
import { CheckoutSelect } from '@/features/checkout/components/checkout-select';
import {
  MAX_COLLECTOR_NOTE_LENGTH,
  WALLET_PROVIDER_LABELS,
  WALLET_PROVIDER_ORDER,
} from '@/features/checkout/constants/checkout';
import { CHECKOUT_COPY, COLLECTOR_FORM_COPY } from '@/features/checkout/constants/checkout-copy';
import type {
  CollectorFormProps,
  SelectOption,
} from '@/features/checkout/types/checkout-components';
import { isNetworkId } from '@/constants/network';
import { cn } from '@/lib/utils';

/**
 * "Perfil do colecionador" — a coluna esquerda do frame de 1440.
 *
 * O frame é uma grade de dois campos por linha. Duas particularidades dele
 * viram decisão de implementação:
 *
 * - **"ENS ou carteira secundária" não tem rótulo visível**: o placeholder faz
 *   esse papel. O rótulo continua no DOM (`hideLabel`), porque o campo precisa
 *   de nome acessível, e a célula ganha o recuo da altura de um rótulo para
 *   alinhar com o campo ao lado — sem isso a linha ficaria torta.
 * - **"Nome ENS" é só o seletor de domínio**: o nome em si é digitado no campo
 *   de ENS/carteira secundária, que é o único campo de texto ENS do layout.
 *
 * Nada aqui decide regra: validação, prefill e erros da API vivem em
 * `useCollectorForm`. O formulário é `noValidate` porque as mensagens são
 * nossas e ficam associadas aos campos — o balão do navegador competiria com
 * elas e sumiria ao primeiro clique.
 *
 * @param props - Estado do formulário e o travamento durante o envio.
 */
export function CollectorForm({ form, isLocked }: CollectorFormProps) {
  const { values, errors, setValue } = form;

  const networkOptions: SelectOption[] = NETWORK_IDS.map((id) => ({
    value: id,
    label: NETWORKS[id].label,
  }));

  const providerOptions: SelectOption[] = WALLET_PROVIDER_ORDER.map((provider) => ({
    value: provider,
    label: WALLET_PROVIDER_LABELS[provider],
  }));

  const ensOptions: SelectOption[] = ENS_DOMAIN_OPTIONS.map((domain) => ({
    value: domain,
    label: domain,
  }));

  return (
    <form
      noValidate
      data-testid="collector-form"
      aria-label={CHECKOUT_COPY.collectorTitle}
      onSubmit={(event) => {
        event.preventDefault();
      }}
      className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2"
    >
      <FormField
        id="collector-display-name"
        label={COLLECTOR_FORM_COPY.displayName}
        isRequired
        error={errors.displayName}
      >
        {(field) => (
          <Input
            {...field}
            value={values.displayName}
            disabled={isLocked}
            autoComplete="name"
            onChange={(event) => {
              setValue('displayName', event.target.value);
            }}
          />
        )}
      </FormField>

      <FormField
        id="collector-username"
        label={COLLECTOR_FORM_COPY.username}
        isRequired
        error={errors.username}
      >
        {(field) => (
          <Input
            {...field}
            value={values.username}
            disabled={isLocked}
            autoComplete="username"
            onChange={(event) => {
              setValue('username', event.target.value);
            }}
          />
        )}
      </FormField>

      <FormField
        id="collector-network"
        label={COLLECTOR_FORM_COPY.network}
        isRequired
        error={errors.network}
      >
        {(field) => (
          <CheckoutSelect
            {...field}
            value={values.network}
            options={networkOptions}
            placeholder={COLLECTOR_FORM_COPY.networkPlaceholder}
            disabled={isLocked}
            onChange={(value) => {
              if (isNetworkId(value)) setValue('network', value);
            }}
          />
        )}
      </FormField>

      <FormField
        id="collector-profile-name"
        label={COLLECTOR_FORM_COPY.profileName}
        isRequired
        error={errors.profileName}
      >
        {(field) => (
          <Input
            {...field}
            value={values.profileName}
            disabled={isLocked}
            onChange={(event) => {
              setValue('profileName', event.target.value);
            }}
          />
        )}
      </FormField>

      <FormField
        id="collector-wallet-address"
        label={COLLECTOR_FORM_COPY.walletAddress}
        isRequired
        error={errors.walletAddress}
      >
        {(field) => (
          <Input
            {...field}
            value={values.walletAddress}
            disabled={isLocked}
            placeholder={COLLECTOR_FORM_COPY.walletAddressPlaceholder}
            onChange={(event) => {
              setValue('walletAddress', event.target.value);
            }}
          />
        )}
      </FormField>

      {/* Sem rótulo no frame: o recuo repõe a altura que o rótulo ocuparia,
          para o campo alinhar com o "Endereço da carteira" ao lado. */}
      <div className="md:mt-[25px]">
        <FormField
          id="collector-secondary-wallet"
          label={COLLECTOR_FORM_COPY.secondaryWallet}
          hideLabel
          error={errors.secondaryWallet}
        >
          {(field) => (
            <Input
              {...field}
              value={values.secondaryWallet ?? ''}
              disabled={isLocked}
              placeholder={COLLECTOR_FORM_COPY.secondaryWalletPlaceholder}
              onChange={(event) => {
                setValue('secondaryWallet', event.target.value);
              }}
            />
          )}
        </FormField>
      </div>

      <FormField
        id="collector-wallet-provider"
        label={COLLECTOR_FORM_COPY.walletProvider}
        isRequired
        error={errors.walletProvider}
      >
        {(field) => (
          <CheckoutSelect
            {...field}
            value={values.walletProvider}
            options={providerOptions}
            placeholder={COLLECTOR_FORM_COPY.walletProviderPlaceholder}
            disabled={isLocked}
            onChange={(value) => {
              const provider = WALLET_PROVIDER_ORDER.find((candidate) => candidate === value);
              if (provider) setValue('walletProvider', provider);
            }}
          />
        )}
      </FormField>

      <FormField
        id="collector-referral"
        label={COLLECTOR_FORM_COPY.referralCode}
        isRequired
        error={errors.referralCode}
      >
        {(field) => (
          <Input
            {...field}
            value={values.referralCode}
            disabled={isLocked}
            onChange={(event) => {
              setValue('referralCode', event.target.value);
            }}
          />
        )}
      </FormField>

      <FormField
        id="collector-email"
        label={COLLECTOR_FORM_COPY.email}
        isRequired
        error={errors.email}
      >
        {(field) => (
          <Input
            {...field}
            type="email"
            value={values.email}
            disabled={isLocked}
            autoComplete="email"
            onChange={(event) => {
              setValue('email', event.target.value);
            }}
          />
        )}
      </FormField>

      <FormField
        id="collector-ens-domain"
        label={COLLECTOR_FORM_COPY.ensDomain}
        isRequired
        error={errors.ensDomain}
      >
        {(field) => (
          <div className="w-[104px]">
            <CheckoutSelect
              {...field}
              value={values.ensDomain}
              options={ensOptions}
              placeholder={COLLECTOR_FORM_COPY.ensDomain}
              disabled={isLocked}
              onChange={(value) => {
                setValue('ensDomain', value);
              }}
            />
          </div>
        )}
      </FormField>

      <div className="md:col-span-2">
        <label
          className={cn(
            'text-body flex w-fit cursor-pointer items-center gap-2',
            isLocked && 'cursor-not-allowed opacity-60',
          )}
        >
          {/* Radio isolado: no frame ele liga e desliga a mesma pergunta, então
              o clique no controle já marcado o desfaz — um grupo de um item
              que não pudesse ser desmarcado prenderia o usuário na escolha. */}
          <input
            type="radio"
            name="collector-alternate-wallet"
            data-testid="use-alternate-wallet"
            checked={values.usesAlternateWallet}
            disabled={isLocked}
            onClick={() => {
              setValue('usesAlternateWallet', !values.usesAlternateWallet);
            }}
            onChange={() => {
              // A mudança é tratada no clique para permitir desmarcar.
            }}
            className="accent-primary size-4 cursor-pointer"
          />
          {COLLECTOR_FORM_COPY.usesAlternateWallet}
        </label>
      </div>

      <div className="md:col-span-2 md:max-w-[350px]">
        <FormField id="collector-note" label={COLLECTOR_FORM_COPY.note} error={errors.note}>
          {(field) => (
            <textarea
              {...field}
              rows={7}
              value={values.note ?? ''}
              disabled={isLocked}
              maxLength={MAX_COLLECTOR_NOTE_LENGTH}
              onChange={(event) => {
                setValue('note', event.target.value);
              }}
              className={cn(
                'text-body rounded-control border-input text-icon-muted w-full resize-y border bg-transparent px-4 py-3 outline-none',
                FOCUS_RING_CLASS,
                'focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-60',
                'aria-invalid:border-destructive',
              )}
            />
          )}
        </FormField>
      </div>
    </form>
  );
}
