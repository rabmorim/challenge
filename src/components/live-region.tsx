import type { LiveRegionProps } from '@/types/a11y';

/**
 * Região viva de uma tela.
 *
 * Uma só por tela, e a mesma para mutations e para eventos de tempo real:
 * mudança de total, remoção de item, quantidade aparada no teto da edição,
 * `nft.updated` e o desfecho de um pedido chegam todos por aqui. É o que cumpre
 * o enunciado §7 — a interface precisa **informar** a alteração, não apenas
 * trocar o número.
 *
 * `polite` por padrão: quase nenhum desses avisos justifica interromper o que o
 * leitor de tela estiver dizendo. A exceção é o bloqueio da compra, que impede
 * a ação em curso e por isso pede `assertive`.
 *
 * @param props - Mensagem corrente, marcador de teste e nível de interrupção.
 */
export function LiveRegion({ message, testId, politeness = 'polite' }: LiveRegionProps) {
  return (
    <output data-testid={testId} aria-live={politeness} className="sr-only">
      {message}
    </output>
  );
}
