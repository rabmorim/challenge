/**
 * Politica de cache e retry do TanStack Query.
 *
 * `staleTime` curto porque o catalogo recebe atualizacoes por Socket.IO;
 * `gcTime` maior para que voltar pelo historico nao dispare refetch visivel.
 */
export const QUERY_DEFAULTS = {
  /** Tempo (ms) em que os dados sao considerados frescos. */
  staleTimeMs: 30_000,
  /** Tempo (ms) que uma query inativa permanece em cache antes do descarte. */
  gcTimeMs: 5 * 60_000,
  /** Tentativas de refetch em falha transitoria. */
  retry: 2,
} as const;

/** Raiz de todas as query keys do app. */
export const QUERY_ROOT = 'kurio' as const;

/**
 * Escopos que estruturam toda query key, logo apos a raiz.
 *
 * A separacao existe para que "limpar dados privados" seja uma operacao exata:
 * no logout, na troca de usuario e na expiracao, o ramo `user` inteiro e
 * removido do cache sem derrubar o catalogo (`public`), que nao pertence a
 * ninguem. A sessao tem ramo proprio porque e ela quem define o escopo dos
 * demais — nao pode viver dentro do escopo que produz.
 */
export const QUERY_SCOPES = {
  /** Estado da sessao corrente. */
  session: 'session',
  /** Recursos publicos: catalogo, detalhe, sonda de saude. */
  public: 'public',
  /** Recursos privados, sempre seguidos do id do dono. */
  user: 'user',
} as const;
