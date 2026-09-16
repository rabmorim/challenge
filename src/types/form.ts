import type { ReactNode } from 'react';

/** Atributos que o campo recebe do `FormField` para ficar associado ao rotulo. */
export interface FormFieldRenderProps {
  /** Id do controle, referenciado pelo `label`. */
  id: string;
  /** Aponta para a mensagem de erro quando ela existe. */
  'aria-describedby': string | undefined;
  /** Marca o campo como invalido para a tecnologia assistiva. */
  'aria-invalid': boolean | undefined;
  /**
   * Marca o campo como obrigatorio.
   * `aria-required` em vez do `required` nativo: o layout marca a
   * obrigatoriedade com o asterisco e a validacao e nossa, entao o balao do
   * navegador so competiria com as mensagens associadas aos campos.
   */
  'aria-required': true | undefined;
}

/** Props de `FormField`. */
export interface FormFieldProps {
  /** Id do controle; a mensagem de erro deriva dele. */
  id: string;
  /** Texto do rotulo — sempre existe, mesmo quando so para leitor de tela. */
  label: string;
  /**
   * Esconde o rotulo visualmente (o design usa placeholder no lugar dele).
   * O rotulo continua no DOM e associado ao campo.
   */
  hideLabel?: boolean;
  /** Mensagem de erro do campo, quando houver. */
  error?: string | undefined;
  /** Desenha o asterisco do layout e marca o campo como obrigatorio. */
  isRequired?: boolean;
  /** Controle do campo, montado com os atributos de associacao. */
  children: (field: FormFieldRenderProps) => ReactNode;
}
