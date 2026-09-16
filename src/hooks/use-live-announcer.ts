import { useCallback, useState } from 'react';

import type { LiveAnnouncer } from '@/types/a11y';

/**
 * Região viva de uma tela, com uma fonte só.
 *
 * Mutations e eventos de tempo real mudam a mesma tela, então precisam falar
 * pelo mesmo `aria-live`: duas regiões concorrentes fariam o leitor de tela
 * cortar um anúncio no meio do outro. Quem anuncia por último ganha a vez, que
 * é o comportamento correto — o aviso mais novo descreve o estado mais novo.
 *
 * Vive fora das features porque carrinho e pagamento precisam exatamente do
 * mesmo comportamento; duas cópias divergiriam na primeira correção.
 *
 * @returns Mensagem corrente e a função que a publica.
 */
export function useLiveAnnouncer(): LiveAnnouncer {
  const [message, setMessage] = useState('');

  const announce = useCallback((next: string) => {
    // O sufixo invisível força a releitura quando a mesma mensagem se repete
    // (dois cliques no "+" que caem no mesmo teto, por exemplo): sem ele o
    // texto não muda e a região viva fica calada.
    setMessage((current) => (current === next ? `${next}\u200B` : next));
  }, []);

  return { message, announce };
}
