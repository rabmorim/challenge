import { BrandWordmark } from '@/components/brand-wordmark';
import { Tabs, TabsContent } from '@/components/ui/tabs';
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
 * E o mesmo componente no modal do desktop e na tela cheia do mobile — muda a
 * moldura, nao a composicao. A marca no topo aparece so no mobile, como no
 * frame do Figma, onde nao ha header por tras para identificar o app.
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
      <BrandWordmark className="text-heading mb-10 self-center sm:hidden" />

      <AuthTabs />

      <SessionExpiredNotice />

      <TabsContent value={AUTH_TABS.signIn} className="mt-8">
        <LoginForm onAuthenticated={onAuthenticated} />
      </TabsContent>

      <TabsContent value={AUTH_TABS.signUp} className="mt-8">
        <SignUpForm onAuthenticated={onAuthenticated} />
      </TabsContent>
    </Tabs>
  );
}
