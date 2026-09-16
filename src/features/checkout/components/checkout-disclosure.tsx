import { ChevronDownIcon } from 'lucide-react';

import type { CheckoutDisclosureProps } from '@/features/checkout/types/checkout-components';

/**
 * Seção recolhível do pagamento no frame de 414.
 *
 * O frame só desenha carteira, rede e total — mas o formulário do colecionador
 * e o resumo do pedido não podem sumir do celular: os campos são obrigatórios e
 * validados pelo servidor, e o resumo é o que diz o que está sendo comprado.
 * Recolhidos, eles ocupam uma linha cada no espaço vazio que o frame deixa
 * entre o total e o CTA.
 *
 * É um `details` nativo, e não um painel com estado próprio: o elemento já
 * entrega `aria-expanded`, operação por teclado e a busca da página encontra o
 * conteúdo fechado. O estado sobe para quem chama porque a confirmação precisa
 * abrir a seção do formulário quando encontra campo inválido.
 *
 * @param props - Título, marcador de teste, estado de abertura e o conteúdo.
 */
export function CheckoutDisclosure({
  title,
  testId,
  isOpen,
  onOpenChange,
  panelRef,
  children,
}: CheckoutDisclosureProps) {
  return (
    <details
      open={isOpen}
      data-testid={testId}
      onToggle={(event) => {
        onOpenChange(event.currentTarget.open);
      }}
      className="group border-divider rounded-control border"
    >
      <summary className="text-body-lg flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-bold [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDownIcon
          className="text-primary size-4 shrink-0 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>

      <div ref={panelRef} className="px-4 pt-1 pb-4">
        {children}
      </div>
    </details>
  );
}
