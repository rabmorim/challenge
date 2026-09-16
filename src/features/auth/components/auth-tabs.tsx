import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AUTH_COPY, AUTH_TABS } from '@/features/auth/constants/auth';

/**
 * Abas "Entrar | Criar conta" do cabecalho do painel.
 *
 * Sao abas de verdade (semantica do Radix: `tablist`, setas do teclado,
 * painel associado) e nao dois textos clicaveis — o design desenha so a
 * divisoria vertical, mas a operacao por teclado e obrigatoria.
 */
export function AuthTabs() {
  return (
    <TabsList className="justify-center gap-4 self-center">
      <TabsTrigger
        value={AUTH_TABS.signIn}
        className="text-title text-tan font-bold data-[state=active]:text-foreground"
      >
        {AUTH_COPY.tabs[AUTH_TABS.signIn]}
      </TabsTrigger>

      <span className="bg-input h-6 w-px" aria-hidden="true" />

      <TabsTrigger
        value={AUTH_TABS.signUp}
        className="text-title text-tan font-bold data-[state=active]:text-foreground"
      >
        {AUTH_COPY.tabs[AUTH_TABS.signUp]}
      </TabsTrigger>
    </TabsList>
  );
}
