import { Link } from '@tanstack/react-router';
import { toast } from 'sonner';

import { NAV_ITEMS, NAV_LABEL, OUT_OF_SCOPE_NOTICE } from '@/constants/navigation';
import { cn } from '@/lib/utils';

/**
 * Classes comuns a todo item do menu.
 *
 * Os itens ocupam a altura inteira da faixa do header e centralizam o rótulo
 * nela — o sublinhado do item ativo é desenhado fora do fluxo (`after`), para
 * que marcar um item não empurre o texto para cima e desalinhe o menu da marca
 * e das ações da direita.
 */
const NAV_ITEM_CLASS = 'text-body-lg relative flex h-full cursor-pointer items-center';

/**
 * Sublinhado do item ativo.
 *
 * `-bottom-[9px]` desce os 8px de respiro do header mais o traço da borda: a
 * marca fica **sobre** a linha que fecha o header, como no `design/Início.png`.
 */
const NAV_ACTIVE_CLASS =
  'text-primary after:bg-primary after:absolute after:inset-x-0 after:-bottom-[9px] after:h-0.5 after:content-[""]';

/**
 * Navegação principal do header.
 *
 * Os itens que apontam para telas da entrega são `Link` de verdade, com o
 * estado ativo marcado por sublinhado no accent **e** por `aria-current` — cor
 * sozinha não comunica o item corrente.
 *
 * "Criadores" e "Aprenda" são páginas editoriais, fora do escopo do enunciado
 * §3. Em vez de linkar para o vazio ou fingir uma tela, eles avisam o que são —
 * o mesmo tratamento que a Fase 2 deu às ações sociais do painel de login.
 */
export function SiteNav() {
  return (
    <nav aria-label={NAV_LABEL} className="h-full">
      <ul className="flex h-full items-stretch gap-6 xl:gap-10">
        {NAV_ITEMS.map((item) => (
          <li key={item.label} className="flex">
            {item.to ? (
              <Link
                to={item.to}
                className={NAV_ITEM_CLASS}
                activeProps={{
                  className: NAV_ACTIVE_CLASS,
                  'aria-current': 'page',
                }}
                activeOptions={{ exact: item.exact }}
              >
                {item.label}
              </Link>
            ) : (
              <button
                type="button"
                className={cn(NAV_ITEM_CLASS, 'text-foreground')}
                onClick={() => {
                  toast.info(OUT_OF_SCOPE_NOTICE(item.label));
                }}
              >
                {item.label}
              </button>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
