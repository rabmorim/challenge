import { useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router';

import { ROUTES } from '@/constants/routes';
import type { BackNavigation } from '@/types/navigation';

/**
 * Ação da seta de voltar dos frames de 414.
 *
 * A seta volta de verdade pelo histórico do router — e não com um `Link` fixo
 * para o catálogo, que jogaria fora a busca, os filtros e a página de onde a
 * tela foi aberta. Quando não há para onde voltar (a URL foi aberta direto, ou
 * é a primeira entrada do histórico), ela leva ao Mercado, que é a tela de onde
 * o fluxo teria vindo.
 *
 * Vive fora das features porque o detalhe do NFT e o carrinho desenham a mesma
 * seta no frame de 414.
 *
 * @returns Se há histórico anterior e o disparo do retorno.
 */
export function useBackNavigation(): BackNavigation {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const navigate = useNavigate();

  return {
    canGoBack,
    goBack: () => {
      if (canGoBack) {
        router.history.back();
        return;
      }

      void navigate({ to: ROUTES.marketplace });
    },
  };
}
