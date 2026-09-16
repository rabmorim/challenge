import { Link } from '@tanstack/react-router';

import { ROUTES } from '@/constants/routes';
import { CHECKOUT_COPY } from '@/features/checkout/constants/checkout-copy';
import { MARKETPLACE_COPY } from '@/features/catalog/constants/catalog-copy';

/**
 * Trilha "Início / Mercado / Pagamento" do frame de 1440.
 *
 * O passo corrente não é link e carrega `aria-current="page"`: em uma trilha, o
 * item da própria página não leva a lugar nenhum, e marcar isso evita que o
 * leitor de tela anuncie um link que não sai do lugar.
 */
export function CheckoutBreadcrumb() {
  return (
    <nav aria-label={CHECKOUT_COPY.breadcrumbLabel}>
      <ol className="text-bright flex items-center gap-2 text-[15px] leading-4 font-bold">
        <li>
          <Link to={ROUTES.home} className="rounded-control">
            {CHECKOUT_COPY.breadcrumbHome}
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <Link to={ROUTES.marketplace} className="rounded-control">
            {MARKETPLACE_COPY.title}
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page">{CHECKOUT_COPY.breadcrumbCurrent}</li>
      </ol>
    </nav>
  );
}
