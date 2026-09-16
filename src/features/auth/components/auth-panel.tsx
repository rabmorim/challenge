import { BrandWordmark } from '@/components/brand-wordmark';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { AuthHeading } from '@/features/auth/components/auth-heading';
import { AuthSwitchLink } from '@/features/auth/components/auth-switch-link';
import { AuthTabs } from '@/features/auth/components/auth-tabs';
import { LoginForm } from '@/features/auth/components/login-form';
import { SessionExpiredNotice } from '@/features/auth/components/session-expired-notice';
import { SignUpForm } from '@/features/auth/components/sign-up-form';
import { AUTH_TABS } from '@/features/auth/constants/auth';
import { isAuthTab } from '@/features/auth/lib/auth-search';
import type { AuthPanelProps } from '@/features/auth/types/auth-components';

/**
 * Conteudo do painel de autenticacao.
 *
 * E o mesmo componente no modal do desktop e na tela cheia do mobile, mas os
 * dois frames nao tem o mesmo cabecalho: em 1440 a troca de aba e a propria
 * lista de abas; em 414 o topo traz a marca e o titulo da tela, e a troca cai
 * no rodape. As abas do Radix continuam montadas nos dois — no celular so
 * deixam de aparecer, o que mantem um unico dono do estado de aba.
 *
 * @param props - Aba atual, troca de aba e callbacks dos formularios.
 */
export function AuthPanel({ tab, onTabChange, onAuthenticated }: AuthPanelProps) {
  return (
    <Tabs
      value={tab}
      onValueChange={(value) => {
        if (isAuthTab(value)) onTabChange(value);
      }}
    >
      <BrandWordmark className="text-heading mb-22 self-center sm:hidden" />

      <AuthTabs />

      <AuthHeading tab={tab} />

      <SessionExpiredNotice />

      <TabsContent value={AUTH_TABS.signIn} className="mt-3 sm:mt-8">
        <LoginForm onAuthenticated={onAuthenticated} />
      </TabsContent>

      <TabsContent value={AUTH_TABS.signUp} className="mt-3 sm:mt-8">
        <SignUpForm onAuthenticated={onAuthenticated} />
      </TabsContent>

      <AuthSwitchLink tab={tab} onTabChange={onTabChange} />
    </Tabs>
  );
}
