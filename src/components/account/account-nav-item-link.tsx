import { Link } from '@tanstack/react-router';
import { toast } from 'sonner';

import { AccountNavIcon } from '@/components/account/account-nav-icon';
import { ACCOUNT_OUT_OF_SCOPE_NOTICE, ACCOUNT_SOON_BADGE } from '@/constants/account-nav';
import type { AccountNavItemLinkProps } from '@/types/account-components';
import { cn } from '@/lib/utils';

/** Classes comuns às linhas da barra lateral — a medida de 40px vem do frame. */
const ITEM_CLASS =
  'text-body relative flex w-full items-center gap-3 py-2.5 pr-3 pl-4 text-left';

/**
 * Faixa accent que marca o item aberto, encostada na borda esquerda do painel.
 * Além da cor, o item aberto carrega `aria-current` — estado não pode depender
 * só de cor (§10).
 */
const ACTIVE_CLASS =
  'text-primary before:bg-primary before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:content-[""]';

/**
 * Item da barra lateral "Meu perfil".
 *
 * Duas formas, uma decisão só: item com destino é `Link` de verdade; item sem
 * destino é uma seção **fora do escopo** do enunciado §3.
 *
 * A seção fora de escopo continua sendo um `button` alcançável por Tab e marcada
 * com `aria-disabled` — e não `disabled` — de propósito: um controle
 * desabilitado sai da ordem de foco e não pode explicar nada, então quem navega
 * por teclado só encontraria um item mudo. Assim ele é focável, anuncia que está
 * indisponível, traz o selo "em breve" (estado visível sem depender de cor) e,
 * ao ser acionado, diz o que é. O que ele nunca faz é navegar ou aparentar que
 * algo aconteceu.
 *
 * @param props - Rótulo, destino, glifo e o aviso de navegação para o celular.
 */
export function AccountNavItemLink({ label, to, icon, onNavigate }: AccountNavItemLinkProps) {
  if (to) {
    return (
      <Link
        to={to}
        onClick={onNavigate}
        className={cn(ITEM_CLASS, 'text-tan')}
        activeProps={{ className: cn(ITEM_CLASS, ACTIVE_CLASS), 'aria-current': 'page' }}
        activeOptions={{ exact: true }}
      >
        <AccountNavIcon id={icon} className="size-4 shrink-0" />
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-disabled="true"
      className={cn(ITEM_CLASS, 'text-tan/60 cursor-not-allowed')}
      onClick={() => {
        toast.info(ACCOUNT_OUT_OF_SCOPE_NOTICE(label));
      }}
    >
      <AccountNavIcon id={icon} className="size-4 shrink-0" />
      {label}
      <span className="border-input text-caption text-tan/70 ml-auto rounded-full border px-2 py-0.5">
        {ACCOUNT_SOON_BADGE}
      </span>
    </button>
  );
}
