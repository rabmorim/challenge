import { createFileRoute } from '@tanstack/react-router';

import { WalletsScreen } from '@/features/wallets/components/wallets-screen';

/**
 * Carteiras do colecionador.
 *
 * Rota privada: o guard vive no layout `_private` que a envolve, e a barra
 * lateral "Meu perfil" no `_account`. As carteiras salvas aqui sao as MESMAS
 * que a tela de pagamento le — mesma query, mesma entrada de cache.
 */
export const Route = createFileRoute('/_private/_account/carteiras')({
  component: WalletsScreen,
});
