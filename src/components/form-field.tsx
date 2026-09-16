import { cn } from '@/lib/utils';
import { AlertCircleIcon } from 'lucide-react';

import { Label } from '@/components/ui/label';
import type { FormFieldProps } from '@/types/form';

/** Sufixo do id da mensagem de erro, derivado do id do campo. */
const ERROR_ID_SUFFIX = '-error';

/**
 * Campo de formulario com rotulo e erro associados.
 *
 * Concentra a ligacao que o desafio exige (`label` para o controle, erro por
 * `aria-describedby`, `aria-invalid`, obrigatoriedade por `aria-required`) para
 * que nenhum formulario precise repetir — e nenhum esqueca. O erro traz icone
 * alem da cor: estado nao pode depender so de cor.
 *
 * @param props - Id, rotulo, obrigatoriedade, erro e o controle a montar.
 */
export function FormField({
  id,
  label,
  hideLabel = false,
  isRequired = false,
  error,
  children,
}: FormFieldProps) {
  const errorId = `${id}${ERROR_ID_SUFFIX}`;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className={cn(hideLabel && 'sr-only')}>
        {label}
        {isRequired && (
          /* Decorativo: quem nao enxerga recebe a obrigatoriedade por
             `aria-required`, e nao por um asterisco lido em voz alta. */
          <span aria-hidden="true" className="text-primary ml-0.5">
            *
          </span>
        )}
      </Label>

      {children({
        id,
        'aria-describedby': error ? errorId : undefined,
        'aria-invalid': error ? true : undefined,
        'aria-required': isRequired ? true : undefined,
      })}

      {error && (
        <p id={errorId} className="text-destructive text-body flex items-center gap-1.5">
          <AlertCircleIcon className="size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
