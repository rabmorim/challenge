import { QUERY_ROOT, QUERY_SCOPES } from '@/constants/query';
import type { QueryKeyPart } from '@/types/query';

/**
 * Fabrica unica de query keys.
 *
 * Toda key nasce aqui para que o isolamento por usuario seja estrutural, e nao
 * uma convencao que alguem pode esquecer: recurso privado carrega o id do dono
 * no proprio caminho, entao o cache do usuario A nunca casa com a query do
 * usuario B nem enquanto os dois estao no mesmo `QueryClient`.
 */
export const queryKeys = {
  /**
   * Estado da sessao corrente.
   *
   * @returns Key do estado de sessao.
   */
  session: () => [QUERY_ROOT, QUERY_SCOPES.session] as const,

  /**
   * Raiz dos recursos publicos — util para invalidar o catalogo inteiro.
   *
   * @returns Key raiz do escopo publico.
   */
  publicRoot: () => [QUERY_ROOT, QUERY_SCOPES.public] as const,

  /**
   * Recurso publico (nao pertence a nenhum usuario).
   *
   * @param parts - Caminho do recurso e seus parametros.
   * @returns Key no escopo publico.
   */
  public: (...parts: readonly QueryKeyPart[]) =>
    [QUERY_ROOT, QUERY_SCOPES.public, ...parts] as const,

  /**
   * Raiz dos recursos privados — e o que o logout e a troca de usuario removem.
   *
   * @returns Key raiz do escopo privado.
   */
  privateRoot: () => [QUERY_ROOT, QUERY_SCOPES.user] as const,

  /**
   * Recurso privado de um usuario.
   *
   * @param userId - Dono dos dados; entra na key para isolar as sessoes.
   * @param parts - Caminho do recurso e seus parametros.
   * @returns Key no escopo privado do usuario.
   */
  private: (userId: string, ...parts: readonly QueryKeyPart[]) =>
    [QUERY_ROOT, QUERY_SCOPES.user, userId, ...parts] as const,
} as const;
