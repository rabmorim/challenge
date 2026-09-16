import { FormField } from '@/components/form-field';
import { Input } from '@/components/ui/input';
import { ENS_DOMAIN_OPTIONS } from '@/constants/ens';
import { CheckoutSelect } from '@/features/checkout/components/checkout-select';
import type { SelectOption } from '@/features/checkout/types/checkout-components';
import type { EnsNameFieldProps } from '@/types/account-components';

/**
 * Campo "Nome ENS" — o seletor de domínio mais o rótulo, lado a lado.
 *
 * Os dois frames (perfil e carteiras) desenham exatamente esta dupla, e o
 * contrato guarda um campo só (`nova.kurio.eth`). A composição e a decomposição
 * ficam no hook de cada formulário (`lib/ens-name.ts`); aqui mora só o desenho.
 *
 * A caixa do seletor é mais larga que a do frame (152px contra ~76px) porque a
 * lista tem domínios mais longos que o `.eth` desenhado: na medida do frame,
 * escolher `.kurio.eth` mostraria o valor cortado, e um controle que não deixa
 * ler a própria escolha é pior do que a diferença de largura.
 *
 * O rótulo visível pertence ao SELETOR (é o que o frame rotula); a caixa de
 * texto ganha um rótulo próprio escondido, porque um controle sem nome
 * acessível é um campo que o leitor de tela anuncia como "edição" e nada mais.
 * O erro é apontado pelo campo de texto — é onde o valor recusado está.
 *
 * @param props - Ids, valores, rótulos, erro e os dois callbacks de mudança.
 */
export function EnsNameField({
  id,
  label,
  textLabel,
  labelValue,
  domainValue,
  error,
  disabled = false,
  onLabelChange,
  onDomainChange,
}: EnsNameFieldProps) {
  const domainId = `${id}-domain`;
  const options: SelectOption[] = ENS_DOMAIN_OPTIONS.map((domain) => ({
    value: domain,
    label: domain,
  }));

  return (
    <FormField id={domainId} label={label} isRequired error={error}>
      {(field) => (
        <div className="flex items-start gap-2">
          <div className="w-[152px] shrink-0">
            <CheckoutSelect
              {...field}
              value={domainValue}
              options={options}
              placeholder={label}
              disabled={disabled}
              onChange={onDomainChange}
            />
          </div>

          <div className="min-w-0 flex-1">
            <label htmlFor={id} className="sr-only">
              {textLabel}
            </label>
            <Input
              id={id}
              value={labelValue}
              disabled={disabled}
              aria-describedby={field['aria-describedby']}
              aria-invalid={field['aria-invalid']}
              aria-required
              onChange={(event) => {
                onLabelChange(event.target.value);
              }}
            />
          </div>
        </div>
      )}
    </FormField>
  );
}
