import {
  CircleCheckIcon,
  DownloadIcon,
  HeartIcon,
  MapPinIcon,
  ShoppingBagIcon,
  TriangleAlertIcon,
  UserIcon,
} from 'lucide-react';
import type { ComponentType } from 'react';

import type { AccountNavIconId } from '@/constants/account-nav';
import type { AccountNavIconProps } from '@/types/account-components';

/**
 * Glifos da barra lateral da conta.
 *
 * Vêm do `lucide-react` (DESIGN_SPEC §6: line icons não são exportados do
 * Figma) e são sempre decorativos — quem nomeia o destino é o rótulo ao lado,
 * não o desenho.
 */
const ICONS: Record<AccountNavIconId, ComponentType<{ className?: string | undefined }>> = {
  profile: UserIcon,
  wallets: MapPinIcon,
  activity: ShoppingBagIcon,
  watchlist: HeartIcon,
  offers: CircleCheckIcon,
  downloads: DownloadIcon,
  support: TriangleAlertIcon,
};

/**
 * Desenha o glifo de um item da barra lateral.
 *
 * @param props - Chave do glifo e classes extras.
 */
export function AccountNavIcon({ id, className }: AccountNavIconProps) {
  const Icon = ICONS[id];
  return <Icon className={className} />;
}
