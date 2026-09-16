import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CHECKOUT_COPY } from '@/features/checkout/constants/checkout-copy';
import type { CouponDisclosureProps } from '@/features/checkout/types/checkout-components';

/**
 * "Tem um código promocional? Aplique aqui".
 *
 * No frame de pagamento o cupom é uma **chamada**, não um campo aberto: a linha
 * de texto ocupa o lugar de um campo inteiro e o formulário só aparece quando
 * alguém decide usá-lo. Implementado como `disclosure` de verdade
 * (`aria-expanded` + `aria-controls`) para que quem navega por teclado saiba
 * que o botão revela conteúdo, em vez de encontrar um campo que apareceu do
 * nada.
 *
 * O envio passa pela cotação da API — o desconto exibido é o que o servidor
 * calculou. A recusa vira mensagem associada ao campo, e o resumo em vigor
 * continua na tela: um cupom recusado não invalida valores que já estavam
 * certos.
 *
 * @param props - Estado da cotação e as ações de cupom.
 */
export function CouponDisclosure({ quote }: CouponDisclosureProps) {
  const panelId = useId();
  const inputId = useId();
  const errorId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState('');

  const applied = quote.coupon;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-caption text-center">
        {CHECKOUT_COPY.couponPrompt}{' '}
        <Button
          variant="link"
          size="inline"
          data-testid="coupon-toggle"
          aria-expanded={isOpen}
          aria-controls={panelId}
          /* A chamada é uma linha só no frame, na cor dos rótulos. O sublinhado
             no foco e no ponteiro é o que mantém o controle reconhecível sem
             depender de cor. */
          className="text-caption text-foreground underline-offset-4 focus-visible:underline"
          onClick={() => {
            setIsOpen((current) => !current);
          }}
        >
          {CHECKOUT_COPY.couponAction}
        </Button>
      </p>

      <div id={panelId} hidden={!isOpen} className="flex flex-col gap-2">
        <form
          noValidate
          className="flex items-start gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            quote.applyCoupon(code);
          }}
        >
          <div className="flex-1">
            <label htmlFor={inputId} className="sr-only">
              {CHECKOUT_COPY.couponLabel}
            </label>
            <Input
              id={inputId}
              name="couponCode"
              autoComplete="off"
              data-testid="coupon-input"
              value={code}
              disabled={quote.isApplyingCoupon}
              aria-invalid={quote.couponError ? true : undefined}
              aria-describedby={quote.couponError ? errorId : undefined}
              placeholder={CHECKOUT_COPY.couponPlaceholder}
              onChange={(event) => {
                setCode(event.target.value);
              }}
            />
          </div>

          <Button type="submit" size="sm" data-testid="coupon-apply" disabled={quote.isApplyingCoupon}>
            {quote.isApplyingCoupon ? CHECKOUT_COPY.couponApplying : CHECKOUT_COPY.couponApply}
          </Button>
        </form>

        {quote.couponError && (
          <p id={errorId} data-testid="coupon-error" role="alert" className="text-destructive text-caption">
            {quote.couponError}
          </p>
        )}

        {applied && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-tan text-caption">{applied.label}</p>
            <Button
              variant="link"
              size="inline"
              data-testid="coupon-remove"
              className="text-caption"
              onClick={quote.removeCoupon}
            >
              {CHECKOUT_COPY.couponRemove(applied.code)}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
