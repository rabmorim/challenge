import { Link } from '@tanstack/react-router';

import { BrandWordmark } from '@/components/brand-wordmark';
import { HeaderSearch } from '@/components/header-search';
import { SiteNav } from '@/components/site-nav';
import { ROUTES } from '@/constants/routes';
import { AuthControl } from '@/features/auth/components/auth-control';
import { CartBadge } from '@/features/cart/components/cart-badge';

/**
 * Header do app.
 *
 * Composição do DESIGN_SPEC §4: marca à esquerda, navegação centralizada e as
 * ações (busca, carrinho, conta) à direita, em uma faixa de 1200px. Todos os
 * destinos existem — o menu não aponta para tela inexistente.
 *
 * Nenhum frame mobile do Figma desenha este header: em celulares cada tela abre
 * com o próprio topo (a busca na Início, a linha de voltar no detalhe e no
 * carrinho) e a navegação mora na barra inferior (`MobileNav`). Por isso ele é
 * `md:` para cima — esconder aqui é o que faz a Início mobile começar pela
 * busca, como no frame de 414.
 */
export function SiteHeader() {
  return (
    <header data-testid="site-header" className="hidden md:block">
      <div className="border-input/60 mx-auto flex min-h-[45px] max-w-(--container-page) items-center justify-between gap-4 border-b px-4 py-2 md:px-6 xl:px-0">
        <Link to={ROUTES.home} className="rounded-control shrink-0">
          <BrandWordmark />
        </Link>

        <div className="hidden self-stretch md:block">
          <SiteNav />
        </div>

        {/* No frame a lupa e o carrinho andam juntos (centros a 44px) e só o
            controle de conta fica afastado — por isso os dois grupos. */}
        <div className="flex items-center gap-2 md:gap-4 xl:gap-9">
          <div className="flex items-center gap-1 xl:gap-2">
            <HeaderSearch />
            <CartBadge />
          </div>
          <AuthControl />
        </div>
      </div>
    </header>
  );
}
