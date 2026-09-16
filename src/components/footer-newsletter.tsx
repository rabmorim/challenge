import { useId, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FOOTER_COPY } from '@/constants/footer';

/**
 * Bloco de newsletter do rodapé.
 *
 * A inscrição está fora do escopo da entrega (§3 do enunciado), então o envio
 * **não simula sucesso**: diz que a ação não faz parte da demonstração. O campo
 * continua sendo um formulário de verdade, com rótulo associado e envio por
 * Enter, para que a operação por teclado seja a mesma de qualquer outro campo.
 *
 * Medidas do Figma: o par campo + botão ocupa a coluna inteira (~326px) com
 * 40px de altura, o campo com 12px de recuo interno e o botão dimensionado pelo
 * próprio texto. É a parte mais larga do bloco de destaques, e por isso a
 * coluna da newsletter é maior que as outras três.
 */
export function FooterNewsletter() {
  const inputId = useId();
  const [email, setEmail] = useState('');

  return (
    <section className="flex flex-col gap-2.5 px-4">
      <h3 className="text-body-lg font-bold">{FOOTER_COPY.newsletterTitle}</h3>

      <form
        className="flex h-10 w-full items-stretch"
        onSubmit={(event) => {
          event.preventDefault();
          toast.info(FOOTER_COPY.newsletterOutOfScope);
        }}
      >
        <label className="sr-only" htmlFor={inputId}>
          {FOOTER_COPY.newsletterLabel}
        </label>
        <Input
          id={inputId}
          type="email"
          name="email"
          placeholder={FOOTER_COPY.newsletterPlaceholder}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
          }}
          className="h-full rounded-r-none border-r-0 px-3 py-0"
        />
        <Button type="submit" size="sm" className="h-full shrink-0 rounded-l-none px-4">
          {FOOTER_COPY.newsletterSubmit}
        </Button>
      </form>

      <p className="text-tan text-body leading-[22px]">{FOOTER_COPY.newsletterDescription}</p>
    </section>
  );
}
