import type { ReactNode } from 'react';

import type { AccountNavIconId } from '@/constants/account-nav';

/** Props dos componentes do shell de conta. */

/** Props de `AccountNavIcon`. */
export interface AccountNavIconProps {
  id: AccountNavIconId;
  className?: string;
}

/** Props de `AccountNavItemLink`. */
export interface AccountNavItemLinkProps {
  label: string;
  /** `null` marca uma secao fora do escopo da entrega. */
  to: string | null;
  icon: AccountNavIconId;
  /** Fecha o menu recolhido do celular depois de navegar. */
  onNavigate: () => void;
}

/** Props de `AccountNav`. */
export interface AccountNavProps {
  /** Chamado quando um item navega — o celular usa para recolher o menu. */
  onNavigate: () => void;
}

/** Props de `AccountShell`. */
export interface AccountShellProps {
  children: ReactNode;
}

/** Props de `EnsNameField` — o seletor de dominio mais o rotulo. */
export interface EnsNameFieldProps {
  /** Id do campo de TEXTO; o do seletor deriva dele. */
  id: string;
  /** Rotulo visivel ("Nome ENS"), pertencente ao seletor. */
  label: string;
  /** Rotulo escondido do campo de texto, para ele ter nome acessivel. */
  textLabel: string;
  /** Rotulo digitado (a parte antes do dominio). */
  labelValue: string;
  /** Dominio escolhido no seletor. */
  domainValue: string;
  error?: string | undefined;
  disabled?: boolean;
  /**
   * Avisa a digitacao do rotulo.
   *
   * @param value - Texto digitado.
   */
  onLabelChange: (value: string) => void;
  /**
   * Avisa a escolha do dominio.
   *
   * @param value - Dominio selecionado.
   */
  onDomainChange: (value: string) => void;
}
