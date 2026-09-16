import { useEffect, useRef } from 'react';

/**
 * Devolve o foco a quem abriu o painel quando ele fecha.
 *
 * O Radix devolve o foco sozinho quando o dialogo e aberto pelo `DialogTrigger`
 * dele. Aqui a abertura e uma NAVEGACAO (o painel e estado de URL), entao nao
 * existe gatilho que o Radix conheca — e, sem isto, fechar com `Esc` deixaria o
 * foco no `body`, obrigando quem navega por teclado a comecar da pagina de novo.
 *
 * Guarda o elemento focado no momento da abertura e o refoca no fechamento, se
 * ele ainda estiver no documento (depois de uma retomada de fluxo, a tela pode
 * ter mudado e o elemento nao existir mais).
 *
 * @param isOpen - Estado de abertura do painel.
 */
export function useReturnFocus(isOpen: boolean): void {
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      const active = document.activeElement;
      openerRef.current = active instanceof HTMLElement ? active : null;
      return;
    }

    const opener = openerRef.current;
    openerRef.current = null;
    if (opener?.isConnected) opener.focus();
  }, [isOpen]);
}
