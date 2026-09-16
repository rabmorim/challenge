import { Link } from '@tanstack/react-router';
import { HeartIcon, HomeIcon, ScanLineIcon, ShoppingCartIcon, type LucideIcon } from 'lucide-react';

import {
  MOBILE_NAV_EXPLORE_LABEL,
  MOBILE_NAV_ITEMS,
  MOBILE_NAV_LABEL,
} from '@/constants/navigation';
import { ROUTES } from '@/constants/routes';
import { AccountShortcut } from '@/features/auth/components/account-shortcut';
import type { MobileNavIconId } from '@/types/navigation';

/** Glifo de cada atalho — o dado do item mora em `MOBILE_NAV_ITEMS`. */
const MOBILE_NAV_ICONS: Record<MobileNavIconId, LucideIcon> = {
  home: HomeIcon,
  favorites: HeartIcon,
  cart: ShoppingCartIcon,
};

/**
 * Coluna de cada item na grade da barra.
 * A terceira coluna fica vazia: é o vão de 106px onde o atalho central encaixa.
 */
const MOBILE_NAV_COLUMNS = ['col-start-1', 'col-start-2', 'col-start-4'] as const;

/**
 * Barra de atalhos do rodapé em celulares.
 *
 * É a navegação da tela no frame de 414 — nenhum frame mobile desenha o header,
 * então é por aqui que se anda pelo app. Todos os itens apontam para rotas
 * reais: favoritos é privado e, sem sessão, o guard leva ao painel de
 * autenticação guardando o destino — o atalho funciona para visitante e para
 * usuário, sem caminho falso. O último lugar da barra é o controle de conta,
 * que substitui o "Entrar" e o menu do header em celulares.
 *
 * O frame desenha só os glifos, sem legenda: o nome de cada destino vive no
 * rótulo acessível, e a rota ativa recebe `aria-current` além da cor.
 *
 * A faixa tem um recorte circular onde o atalho central encaixa (a máscara de
 * `.mobile-nav-surface`); o botão flutua 36px acima dela, como no frame. Ele
 * leva ao Mercado — é o atalho de explorar o catálogo, e não um controle
 * decorativo.
 */
export function MobileNav() {
  return (
    <nav aria-label={MOBILE_NAV_LABEL} className="sticky bottom-0 z-20 md:hidden">
      <div className="relative">
        <div aria-hidden="true" className="mobile-nav-surface rounded-t-card-mobile absolute inset-0" />

        <ul className="relative grid h-[78px] grid-cols-[1fr_1fr_106px_1fr_1fr] items-center px-2 pt-2 pb-[env(safe-area-inset-bottom)]">
          {MOBILE_NAV_ITEMS.map(({ to, label, exact, icon }, index) => {
            const Icon = MOBILE_NAV_ICONS[icon];

            return (
              <li key={to} className={`flex justify-center ${MOBILE_NAV_COLUMNS[index] ?? ''}`}>
                <Link
                  to={to}
                  aria-label={label}
                  className="rounded-control flex size-11 items-center justify-center"
                  // A cor vem por `activeProps`/`inactiveProps`, e não de uma
                  // classe base sobrescrita: duas utilitárias de cor no mesmo
                  // elemento empatariam em especificidade.
                  activeProps={{ className: 'text-link', 'aria-current': 'page' }}
                  inactiveProps={{ className: 'text-tan' }}
                  // `includeSearch: false`: filtros e busca da Início moram na
                  // URL, e com eles ligados o atalho ainda aponta para a tela
                  // em que se está.
                  activeOptions={{ exact, includeSearch: false }}
                >
                  <Icon className="size-4.5 fill-current" aria-hidden="true" />
                </Link>
              </li>
            );
          })}

          <li className="col-start-5 flex justify-center">
            <AccountShortcut />
          </li>
        </ul>

        <Link
          to={ROUTES.marketplace}
          aria-label={MOBILE_NAV_EXPLORE_LABEL}
          className="accent-gradient text-foreground absolute -top-9 left-1/2 flex size-[65px] -translate-x-1/2 items-center justify-center rounded-full [--accent-gradient-from:40%]"
        >
          <ScanLineIcon className="size-8" aria-hidden="true" />
        </Link>
      </div>
    </nav>
  );
}
