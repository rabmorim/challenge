import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { CART_SUMMARY_COPY } from '@/features/cart/constants/cart-copy';
import type { CouponFormProps } from '@/features/cart/types/cart-components';
import { cn } from '@/lib/utils';

/**
 * Campo de código promocional.
 *
 * É um `form` de verdade, então "Enter" no campo envia — e o envio passa pela
 * cotação da API: o desconto que aparece no resumo é o que o servidor calculou,
 * nunca uma conta local.
 *
 * A recusa (código inexistente, expirado ou não aplicável) vira mensagem
 * **associada ao campo** por `aria-describedby` + `aria-invalid`, e não um
 * toast solto: quem usa leitor de tela precisa encontrar o erro a partir do
 * campo que o causou. O resumo em vigor continua na tela — um cupom recusado
 * não invalida valores que já estavam certos.
 *
 * O botão trava enquanto o envio está em voo, o que resolve o duplo submit sem
 * depender de o usuário não clicar duas vezes.
 *
 * @param props - Estado da cotação e a variante visual.
 */
export function CouponForm({ quote, variant }: CouponFormProps) {
  const inputId = useId();
  const errorId = useId();
  const [code, setCode] = useState('');

  const isPanel = variant === 'panel';
  const applied = quote.coupon;

  return (
    <div className="flex flex-col gap-2">
      {!isPanel && (
        <label htmlFor={inputId} className="text-[13px] leading-4 font-bold">
          {CART_SUMMARY_COPY.couponLabel}
        </label>
      )}

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          quote.applyCoupon(code);
        }}
        className={cn(
          'border-primary flex items-stretch overflow-hidden border',
          isPanel ? 'rounded-full' : 'rounded-control h-10',
        )}
      >
        <input
          id={inputId}
          name="couponCode"
          type="text"
          autoComplete="off"
          data-testid="coupon-input"
          value={code}
          disabled={quote.isApplyingCoupon}
          /* O frame de 414 não escreve o rótulo; o campo continua precisando
             de nome acessível, então ele vem pelo atributo. */
          aria-label={isPanel ? CART_SUMMARY_COPY.couponLabel : undefined}
          aria-invalid={quote.couponError ? true : undefined}
          aria-describedby={quote.couponError ? errorId : undefined}
          placeholder={CART_SUMMARY_COPY.couponPlaceholder}
          onChange={(event) => {
            setCode(event.target.value);
          }}
          className={cn(
            'text-tan min-w-0 flex-1 bg-transparent leading-4 outline-none placeholder:text-[color:var(--kurio-icon-muted)]',
            isPanel ? 'py-4 pr-2 pl-5 text-[12px]' : 'px-2.5 text-[11.5px]',
          )}
        />

        <Button
          type="submit"
          size="sm"
          data-testid="coupon-apply"
          disabled={quote.isApplyingCoupon}
          className={cn(
            'text-[15px] font-bold',
            // Largura fixa no frame de 1440: é o que sobra para o campo caber
            // o texto de exemplo inteiro ("Digite o código promocional...").
            isPanel ? 'accent-gradient rounded-full px-6 py-4' : 'w-[102px] rounded-none px-0',
          )}
        >
          {quote.isApplyingCoupon ? CART_SUMMARY_COPY.couponApplying : CART_SUMMARY_COPY.couponApply}
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
            {CART_SUMMARY_COPY.couponRemove(applied.code)}
          </Button>
        </div>
      )}
    </div>
  );
}
