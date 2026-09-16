import { queryOptions } from '@tanstack/react-query';

import { fetchWallets } from '@/features/wallets/api/wallets-api';
import { WALLETS_QUERY_SEGMENT } from '@/features/wallets/constants/wallets';
import { queryKeys } from '@/lib/query-keys';

/**
 * Query das carteiras do colecionador.
 *
 * Vive no ramo privado com o id do dono na chave: carteira e dado de uma conta,
 * e a troca de usuario remove esse ramo inteiro — a query do usuario A nunca
 * casa com a do usuario B, nem enquanto os dois passam pelo mesmo `QueryClient`.
 *
 * E a MESMA entrada de cache que a tela de pagamento consome. Fica aqui, na
 * feature dona do recurso, para que a invalidacao do cadastro alcance as duas
 * telas sem nenhuma delas conhecer a outra.
 *
 * @param userId - Dono das carteiras.
 * @returns Opcoes da query de carteiras.
 */
export function walletsQueryOptions(userId: string) {
  return queryOptions({
    queryKey: queryKeys.private(userId, WALLETS_QUERY_SEGMENT),
    queryFn: ({ signal }) => fetchWallets(signal),
  });
}
