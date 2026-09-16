import { TriangleAlertIcon } from 'lucide-react';

import { SESSION_MESSAGES } from '@/features/auth/constants/auth';
import { useSession } from '@/features/auth/hooks/use-session';

/**
 * Aviso de sessao vencida dentro do painel.
 *
 * Sem ele, quem e trazido de volta ao login por expiracao nao entenderia por
 * que saiu do fluxo — o toast pode ja ter sumido, ou nem ter sido emitido
 * quando a expiracao foi descoberta no carregamento da pagina. O icone
 * acompanha a cor para que o estado nao dependa so dela.
 */
export function SessionExpiredNotice() {
  const { state } = useSession();

  if (state.status !== 'expired') return null;

  return (
    // `output` ja e uma regiao viva com `role="status"` — sem ARIA a mais.
    <output className="text-body text-tan border-input rounded-control mt-6 flex items-center gap-2 border px-4 py-3">
      <TriangleAlertIcon className="text-primary size-4 shrink-0" aria-hidden="true" />
      {SESSION_MESSAGES.expired}
    </output>
  );
}
