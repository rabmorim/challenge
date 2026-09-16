import { SOCIAL_ICON_PATHS } from '@/constants/social-icons';
import type { SocialIconProps } from '@/types/components';
import { cn } from '@/lib/utils';

/**
 * Glifo de uma rede social do rodapé.
 *
 * O pacote de ícones do projeto (`lucide-react`) não traz logotipos de marca —
 * eles foram removidos da biblioteca —, então os cinco glifos do
 * `design/Início.png` são desenhados aqui, num único `path` cada, com
 * `currentColor` para herdar o accent do botão.
 *
 * É sempre decorativo: quem descreve a rede é o `aria-label` do botão que o
 * envolve.
 *
 * @param props - Rede a desenhar e classes extras do `svg`.
 */
export function SocialIcon({ id, className }: SocialIconProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('size-4', className)}
    >
      <path d={SOCIAL_ICON_PATHS[id]} />
    </svg>
  );
}
