import { useRouterState } from '@tanstack/react-router';
import { useState } from 'react';
import { ChevronDownIcon } from 'lucide-react';

import { AccountNav } from '@/components/account/account-nav';
import {
  ACCOUNT_NAV_ITEMS,
  ACCOUNT_NAV_SUMMARY,
  ACCOUNT_NAV_TITLE,
} from '@/constants/account-nav';
import { useCompactLayout } from '@/hooks/use-compact-layout';
import type { AccountShellProps } from '@/types/account-components';

/**
 * Shell de conta — a moldura que perfil e carteiras compartilham.
 *
 * **Desktop (≥ md)** reproduz o frame: painel `#241612` de 310px à esquerda,
 * conteúdo à direita, ambos dentro do container de 1200px.
 *
 * **Celular (390) não tem frame no Figma**, então a adaptação é nossa. A barra
 * lateral vira um `<details>` nativo, recolhido, cujo `summary` anuncia a seção
 * aberta. A escolha é pelo elemento nativo: `aria-expanded`, operação por
 * teclado e o foco ao abrir/fechar já vêm dele — um drawer equivalente exigiria
 * trap de foco, retorno de foco e uma camada de JS para entregar o mesmo. As
 * alternativas sem estado foram descartadas por motivos concretos: empilhar as
 * oito seções empurraria o formulário para baixo da dobra, e uma faixa rolável
 * na horizontal esconderia itens — que é o overflow lateral que o §10 proíbe.
 * O desvio está registrado no ARCHITECTURE.
 *
 * A escolha entre as duas formas acontece ANTES de renderizar
 * (`useCompactLayout`), e não com `md:hidden`: montar as duas deixaria a árvore
 * de acessibilidade com **dois** `nav` de mesmo nome e dois "Sair" — quem usa
 * leitor de tela percorreria a navegação da conta duas vezes.
 *
 * @param props - Conteúdo da coluna direita.
 */
export function AccountShell({ children }: AccountShellProps) {
  const isCompact = useCompactLayout();
  const [isNavOpen, setIsNavOpen] = useState(false);

  // O rótulo da seção sai da rota, e não de uma prop: as duas telas usariam a
  // mesma string que já está na navegação, e repeti-la abriria espaço para o
  // resumo do menu discordar do item marcado como atual.
  const sectionLabel = useRouterState({
    select: (state) =>
      ACCOUNT_NAV_ITEMS.find((item) => item.to === state.location.pathname)?.label ??
      ACCOUNT_NAV_TITLE,
  });

  return (
    <div
      data-testid="account-shell"
      className="mx-auto flex max-w-(--container-page) flex-col gap-6 px-4 py-8 md:flex-row md:gap-7 md:px-6 md:py-10 xl:px-0"
    >
      {isCompact ? (
        /* O `open` é controlado para que navegar feche a lista — sem isso o
           item escolhido continuaria coberto pelo menu. */
        <details
          open={isNavOpen}
          data-testid="account-nav-mobile"
          className="bg-surface rounded-panel group shrink-0"
          onToggle={(event) => {
            setIsNavOpen(event.currentTarget.open);
          }}
        >
          <summary className="text-body-lg flex cursor-pointer items-center justify-between px-4 py-4 font-bold">
            {ACCOUNT_NAV_SUMMARY(sectionLabel)}
            <ChevronDownIcon
              aria-hidden="true"
              className="size-4 shrink-0 transition-transform group-open:rotate-180"
            />
          </summary>

          <div className="pb-3">
            <AccountNav
              onNavigate={() => {
                setIsNavOpen(false);
              }}
            />
          </div>
        </details>
      ) : (
        <aside
          data-testid="account-nav-desktop"
          className="bg-surface rounded-panel h-fit w-[310px] shrink-0 py-5"
        >
          <h2 className="text-body-lg px-4 pb-4 font-bold">{ACCOUNT_NAV_TITLE}</h2>
          <AccountNav
            onNavigate={() => {
              setIsNavOpen(false);
            }}
          />
        </aside>
      )}

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
