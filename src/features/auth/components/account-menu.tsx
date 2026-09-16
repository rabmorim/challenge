import { Link } from '@tanstack/react-router';
import { ChevronDownIcon, UserIcon } from 'lucide-react';

import { AppIcon } from '@/components/app-icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ROUTES } from '@/constants/routes';
import { ACCOUNT_MENU_COPY } from '@/features/auth/constants/auth';
import { useLogoutMutation } from '@/features/auth/hooks/use-session-mutations';
import type { AccountMenuProps } from '@/features/auth/types/auth-components';

/**
 * Menu da conta autenticada, no lugar do botao "Entrar".
 *
 * O Figma nao desenha o estado autenticado do header (todos os frames mostram
 * "Entrar"), entao a composicao e nossa, com os tokens e componentes base: o
 * requisito e refletir a sessao e permitir sair.
 *
 * Na barra de atalhos do frame de 414 (`icon`) sobra so o avatar: o nome
 * continua na arvore de acessibilidade, escondido visualmente, para o menu
 * dizer de quem e a conta sem legenda na barra.
 *
 * @param props - Usuario autenticado e a forma do gatilho.
 */
export function AccountMenu({ user, variant = 'full' }: AccountMenuProps) {
  const logout = useLogoutMutation();
  const isIcon = variant === 'icon';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={isIcon ? 'size-11 px-0' : 'gap-2 px-2'}
          aria-label={ACCOUNT_MENU_COPY.trigger}
        >
          <Avatar className={isIcon ? 'size-6' : 'size-7'}>
            <AvatarImage src={user.avatarUrl} alt="" />
            <AvatarFallback>{user.username.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <span className={isIcon ? 'sr-only' : 'max-w-40 truncate'}>{user.username}</span>
          {!isIcon && <ChevronDownIcon className="size-4" aria-hidden="true" />}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <span className="text-body block truncate">{user.username}</span>
          <span className="text-tan text-body block truncate">{user.email}</span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link to={ROUTES.profile}>
            <UserIcon className="size-4" aria-hidden="true" />
            {ACCOUNT_MENU_COPY.profile}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled={logout.isPending}
          onSelect={() => {
            logout.mutate();
          }}
        >
          <AppIcon id="logout" className="size-4" />
          {logout.isPending ? ACCOUNT_MENU_COPY.signingOut : ACCOUNT_MENU_COPY.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
