import { useNavigate, useSearch } from '@tanstack/react-router';
import { useCallback } from 'react';

import { DEFAULT_AUTH_TAB, toSafeRedirect } from '@/features/auth/lib/auth-search';
import type { AuthPanelController, AuthTab } from '@/features/auth/types/auth-navigation';

/**
 * Controla o painel de autenticacao a partir da URL.
 *
 * Abrir, trocar de aba e fechar sao navegacoes: o painel vira estado de
 * endereco (`?auth=`), sobrevive ao refresh e ao historico, e o guard consegue
 * mandar o visitante para ca carregando o destino pretendido (`?redirect=`) —
 * que e o que permite retomar o fluxo interrompido depois de entrar.
 *
 * @returns Controle do painel (estado corrente e acoes de navegacao).
 */
export function useAuthPanel(): AuthPanelController {
  const navigate = useNavigate();
  const { auth, redirect } = useSearch({ strict: false });

  const redirectTo = toSafeRedirect(redirect);

  const open = useCallback(
    (tab: AuthTab) => {
      void navigate({ to: '.', search: (previous) => ({ ...previous, auth: tab }), replace: false });
    },
    [navigate],
  );

  const selectTab = useCallback(
    (tab: AuthTab) => {
      // `replace` para que alternar entre abas nao encha o historico.
      void navigate({ to: '.', search: (previous) => ({ ...previous, auth: tab }), replace: true });
    },
    [navigate],
  );

  const close = useCallback(() => {
    void navigate({
      to: '.',
      search: ({ auth: _auth, redirect: _redirect, ...rest }) => rest,
      replace: true,
    });
  }, [navigate]);

  const finish = useCallback(() => {
    if (redirectTo) {
      void navigate({ href: redirectTo });
      return;
    }

    void navigate({
      to: '.',
      search: ({ auth: _auth, redirect: _redirect, ...rest }) => rest,
      replace: true,
    });
  }, [navigate, redirectTo]);

  return {
    isOpen: auth !== undefined,
    tab: auth ?? DEFAULT_AUTH_TAB,
    redirectTo,
    open,
    selectTab,
    close,
    finish,
  };
}
