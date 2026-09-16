import type { QueryClient } from '@tanstack/react-query';

import { clearAllAttempts } from '@/features/checkout/lib/attempt-storage';
import { resetSocketSession } from '@/features/realtime/api/socket-client';
import { queryKeys } from '@/lib/query-keys';

/**
 * Ciclo de vida da sessao no cliente.
 *
 * Login, cadastro, logout e expiracao convergem para a mesma funcao: nenhum
 * caminho pode esquecer metade da limpeza. Isolamento entre usuarios e regra
 * eliminatoria do desafio, e o preco de duplicar essa sequencia seria vazar
 * dado de uma conta na sessao da outra.
 */

/**
 * Remove do cache tudo que pertence ao usuario anterior.
 *
 * `removeQueries` (e nao `invalidateQueries`) de proposito: invalidar mantem a
 * linha antiga renderizavel enquanto o refetch acontece — ou seja, os dados do
 * usuario anterior continuariam na tela por um instante. Como toda key privada
 * carrega o id do dono, o que a conta seguinte pedir sera outra key, nunca a
 * que acabou de ser descartada.
 *
 * A query de SESSAO nao entra aqui: ela tem observadores permanentes (o header,
 * por exemplo) e remove-la os deixaria presos a uma query que saiu do cache —
 * eles parariam de receber atualizacao. O estado novo da sessao e publicado por
 * quem chama, com `setQueryData`.
 *
 * @param queryClient - Cache do app.
 */
export function clearPrivateCache(queryClient: QueryClient): void {
  queryClient.removeQueries({ queryKey: queryKeys.privateRoot() });
}

/**
 * Passa a sessao para outra identidade (login, cadastro, logout, expiracao).
 *
 * Cancela o que estava em voo para a identidade anterior, limpa o cache privado
 * e derruba a conexao de tempo real com todos os seus listeners; a conexao
 * seguinte se anuncia como o novo dono.
 *
 * As tentativas de compra gravadas tambem saem: a chave de idempotencia e um
 * dado privado, e o servidor a guarda junto com o dono — uma chave sobrevivente
 * so produziria conflito na conta seguinte.
 *
 * @param queryClient - Cache do app.
 * @param userId - Novo dono da sessao, ou `null` para visitante.
 */
export function switchSessionIdentity(queryClient: QueryClient, userId: string | null): void {
  // Resposta em voo da identidade anterior nao pode sobrescrever a nova.
  void queryClient.cancelQueries({ queryKey: queryKeys.session() });
  clearPrivateCache(queryClient);
  clearAllAttempts();
  resetSocketSession(userId);
}
