import type { RequestHandler, WebSocketHandler } from 'msw';

import { authHandlers } from '@/mocks/handlers/auth';
import { cartHandlers } from '@/mocks/handlers/cart';
import { controlHandlers } from '@/mocks/handlers/control';
import { favoriteHandlers } from '@/mocks/handlers/favorites';
import { healthHandlers } from '@/mocks/handlers/health';
import { nftHandlers } from '@/mocks/handlers/nfts';
import { orderHandlers } from '@/mocks/handlers/orders';
import { profileHandlers } from '@/mocks/handlers/profile';
import { quoteHandlers } from '@/mocks/handlers/quotes';
import { walletHandlers } from '@/mocks/handlers/wallets';
import { socketHandlers } from '@/mocks/socket/handlers';

/**
 * Lista unica de handlers registrada no worker (navegador) e no servidor (Node).
 *
 * Handlers REST e de Socket.IO convivem aqui para que REST e eventos partam
 * sempre do mesmo estado simulado. Os de controle vem primeiro: precisam
 * responder mesmo quando o cenario ativo "derruba" a rede.
 */
export const handlers: Array<RequestHandler | WebSocketHandler> = [
  ...controlHandlers,
  ...healthHandlers,
  ...authHandlers,
  ...nftHandlers,
  ...favoriteHandlers,
  ...cartHandlers,
  ...quoteHandlers,
  ...orderHandlers,
  ...profileHandlers,
  ...walletHandlers,
  ...socketHandlers,
];
