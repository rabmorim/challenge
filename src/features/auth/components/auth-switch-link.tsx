import { Button } from '@/components/ui/button';
import { AUTH_COPY, AUTH_TABS } from '@/features/auth/constants/auth';
import type { AuthSwitchLinkProps } from '@/features/auth/types/auth-components';

/** Aba de destino de cada convite do rodape. */
const NEXT_TAB = {
  [AUTH_TABS.signIn]: AUTH_TABS.signUp,
  [AUTH_TABS.signUp]: AUTH_TABS.signIn,
} as const;

/**
 * Rodape de troca de aba do frame de 414.
 *
 * Substitui as abas no celular, onde elas nao sao desenhadas. A linha inteira e
 * o botao (e nao so as duas ultimas palavras): o frame pinta a frase em uma cor
 * so, e um alvo de toque do tamanho da linha e mais facil de acertar do que um
 * trecho sublinhado.
 *
 * @param props - Aba aberta e callback de troca.
 */
export function AuthSwitchLink({ tab, onTabChange }: AuthSwitchLinkProps) {
  const copy = AUTH_COPY.footer[tab];

  return (
    <Button
      variant="ghost"
      size="inline"
      className="text-tan text-modal mt-8 self-center py-2 text-center sm:hidden"
      onClick={() => {
        onTabChange(NEXT_TAB[tab]);
      }}
    >
      {copy.prompt} {copy.action}
    </Button>
  );
}
