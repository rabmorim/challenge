import { AUTH_COPY, AUTH_TABS } from '@/features/auth/constants/auth';
import type { AuthHeadingProps } from '@/features/auth/types/auth-components';

/** Titulo de cada aba no frame de 414. */
const MOBILE_TITLES = {
  [AUTH_TABS.signIn]: AUTH_COPY.signIn.mobileTitle,
  [AUTH_TABS.signUp]: AUTH_COPY.signUp.mobileTitle,
} as const;

/**
 * Cabecalho do painel no celular.
 *
 * O frame de 414 nao desenha as abas: anuncia a tela por um titulo centralizado
 * ("Entrar" / "Criar perfil de colecionador") e joga a troca para o rodape. As
 * abas continuam no DOM no modal de 1440 — aqui elas cedem o lugar, nao a
 * funcao, entao este titulo e so apresentacao.
 *
 * @param props - Aba aberta, que escolhe o titulo.
 */
export function AuthHeading({ tab }: AuthHeadingProps) {
  return (
    <h2 className="text-title text-foreground text-center text-balance sm:hidden">
      {MOBILE_TITLES[tab]}
    </h2>
  );
}
