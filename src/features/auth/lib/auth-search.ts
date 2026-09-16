import { AUTH_TABS, AUTH_TAB_ORDER, AUTH_SEARCH_KEYS } from '@/features/auth/constants/auth';
import type { AuthSearch, AuthTab } from '@/features/auth/types/auth-navigation';

/**
 * Parametros de busca do painel de autenticacao.
 *
 * O painel e estado de URL: abre sobre qualquer tela, sobrevive ao refresh e ao
 * historico, e carrega o destino pretendido quando um guard interrompe a
 * navegacao. Como tudo isso vem da barra de endereco, e entrada nao confiavel —
 * por isso passa por validacao aqui, e nao direto para o componente.
 */

/** Prefixo de caminho interno valido. */
const INTERNAL_PATH_PREFIX = '/';

/** Prefixo de URL relativa a protocolo (`//host`), que escapa do app. */
const PROTOCOL_RELATIVE_PREFIX = '//';

/**
 * Verifica se o valor e uma aba conhecida.
 *
 * @param value - Valor recebido da URL ou do componente de abas.
 * @returns `true` quando o valor e uma aba do painel.
 */
export function isAuthTab(value: unknown): value is AuthTab {
  return AUTH_TAB_ORDER.some((tab) => tab === value);
}

/**
 * Valida um destino de retomada.
 *
 * So caminho interno passa: aceitar URL absoluta transformaria o parametro em
 * redirecionamento aberto — o painel levaria o visitante para fora do app logo
 * depois de ele digitar a senha.
 *
 * @param target - Valor bruto recebido na URL.
 * @returns Caminho interno seguro, ou `null` quando o valor nao serve.
 */
export function toSafeRedirect(target: unknown): string | null {
  if (typeof target !== 'string' || target.length === 0) return null;
  if (!target.startsWith(INTERNAL_PATH_PREFIX)) return null;
  if (target.startsWith(PROTOCOL_RELATIVE_PREFIX)) return null;
  return target;
}

/**
 * Valida os parametros de busca da rota raiz.
 *
 * Parametro desconhecido ou malformado simplesmente desaparece, em vez de
 * quebrar a rota: uma URL colada errada nao pode derrubar a aplicacao.
 *
 * @param search - Parametros brutos da URL.
 * @returns Parametros de autenticacao validados.
 */
export function validateAuthSearch(search: Record<string, unknown>): AuthSearch {
  const tab = search[AUTH_SEARCH_KEYS.auth];
  const redirect = toSafeRedirect(search[AUTH_SEARCH_KEYS.redirect]);

  return {
    ...(isAuthTab(tab) ? { auth: tab } : {}),
    // O destino so faz sentido acompanhado do painel aberto.
    ...(isAuthTab(tab) && redirect ? { redirect } : {}),
  };
}

/** Aba aberta por padrao quando a URL nao diz qual e. */
export const DEFAULT_AUTH_TAB: AuthTab = AUTH_TABS.signIn;
