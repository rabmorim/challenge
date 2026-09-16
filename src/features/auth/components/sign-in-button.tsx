import { UserIcon } from 'lucide-react';

import { AppIcon } from '@/components/app-icon';
import { Button } from '@/components/ui/button';
import { AUTH_COPY, AUTH_TABS } from '@/features/auth/constants/auth';
import { useAuthPanel } from '@/features/auth/hooks/use-auth-panel';
import type { SignInButtonProps } from '@/features/auth/types/auth-components';

/**
 * Botao "Entrar" (visitante).
 *
 * Abre o painel na aba de login — a abertura e uma navegacao, entao o estado
 * fica na URL e o painel sobrevive ao refresh.
 *
 * Medidas do Figma para `full`: 100x35 (`w-25` / `h-8.75`), raio 6 e gap 10
 * entre o icone (o glifo de 20px exportado do frame) e o rotulo. A altura vem
 * do frame, entao o padding vertical do tamanho `sm` e zerado para nao
 * briga-la. As medidas sao fixas de proposito: o `AuthControl` reserva
 * exatamente este espaco enquanto a sessao carrega, para o header nao saltar
 * quando a resposta chega.
 *
 * `icon` e a forma que cabe na barra de atalhos do frame de 414: so o glifo de
 * pessoa, com o nome da acao no rotulo acessivel.
 *
 * @param props - `variant` escolhe entre a forma do header e a da barra.
 */
export function SignInButton({ variant = 'full' }: SignInButtonProps) {
  const { open } = useAuthPanel();
  const label = AUTH_COPY.tabs[AUTH_TABS.signIn];

  if (variant === 'icon') {
    return (
      <button
        type="button"
        aria-label={label}
        onClick={() => {
          open(AUTH_TABS.signIn);
        }}
        className="text-tan rounded-control flex size-11 cursor-pointer items-center justify-center"
      >
        <UserIcon className="size-4.5 fill-current" aria-hidden="true" />
      </button>
    );
  }

  return (
    <Button
      size="sm"
      className="rounded-button h-8.75 w-25 gap-2.5 px-0 py-0"
      onClick={() => {
        open(AUTH_TABS.signIn);
      }}
    >
      <AppIcon id="logout" />
      {label}
    </Button>
  );
}
