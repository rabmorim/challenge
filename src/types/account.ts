import type { AccountNavIconId } from '@/constants/account-nav';

/**
 * Item da navegacao "Meu perfil".
 *
 * `to` nulo marca uma secao FORA do escopo da entrega (enunciado §3): ela
 * aparece por fidelidade ao frame, mas nao navega — o componente a desenha
 * como indisponivel e explica o motivo quando acionada.
 */
export interface AccountNavItem {
  label: string;
  to: string | null;
  /** Chave do glifo; o componente e quem resolve o desenho. */
  icon: AccountNavIconId;
}
