import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { AUTH_COPY, AUTH_UNAVAILABLE_MESSAGES } from '@/features/auth/constants/auth';
import { FacebookIcon, GoogleIcon } from '@/features/auth/components/social-icons';

/**
 * Entrada por redes sociais.
 *
 * Esta fora do escopo do desafio, entao os botoes existem (o design os mostra)
 * mas avisam que a opcao nao esta disponivel — o enunciado e explicito: acao
 * fora do escopo nao pode aparentar sucesso. Nenhum deles abre sessao.
 *
 * A divisoria sangra ate as bordas do painel: ela anula a goteira lateral pela
 * variavel `--auth-gutter`, publicada por quem monta a moldura.
 */
export function SocialAuthButtons() {
  return (
    <div className="flex flex-col gap-3">
      <div className="-mx-(--auth-gutter) flex items-center gap-3">
        <span className="bg-input h-px flex-1" aria-hidden="true" />
        <span className="text-foreground text-modal">{AUTH_COPY.social.divider}</span>
        <span className="bg-input h-px flex-1" aria-hidden="true" />
      </div>

      <Button
        variant="outline"
        size="sm"
        className="text-modal"
        onClick={() => {
          toast.info(AUTH_UNAVAILABLE_MESSAGES.google);
        }}
      >
        <GoogleIcon />
        {AUTH_COPY.social.google}
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="text-modal"
        onClick={() => {
          toast.info(AUTH_UNAVAILABLE_MESSAGES.facebook);
        }}
      >
        <FacebookIcon />
        {AUTH_COPY.social.facebook}
      </Button>
    </div>
  );
}
