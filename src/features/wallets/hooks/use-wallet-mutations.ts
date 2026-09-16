import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { createWallet, updateWallet } from '@/features/wallets/api/wallets-api';
import { walletsQueryOptions } from '@/features/wallets/api/wallets-queries';
import type {
  CreateWalletRequest,
  UpdateWalletRequest,
  Wallet,
} from '@/features/wallets/types/wallet';
import type { NormalizedHttpError } from '@/types/http';

/**
 * Mutations de carteira: cadastro e atualizacao.
 *
 * Nenhuma e otimista, por escolha: a interacao otimista obrigatoria do
 * enunciado §4 e a de favoritos, e aqui o servidor faz coisas que o cliente nao
 * teria como antecipar sem errar — rebaixa a principal anterior quando outra e
 * promovida, e recusa endereco ja cadastrado com `409`. Elas seguem `loading` /
 * `success` / `error` normais.
 *
 * As duas invalidam a MESMA query que a tela de pagamento consome
 * (`walletsQueryOptions`), entao uma carteira salva aqui ja esta disponivel la
 * — nao ha segunda copia do recurso a sincronizar.
 */

/** Argumentos da atualizacao: a carteira e o que muda nela. */
export interface UpdateWalletVariables {
  walletId: string;
  body: UpdateWalletRequest;
}

/**
 * Cadastra uma carteira.
 *
 * @param userId - Dono das carteiras (entra na query key do ramo privado).
 * @returns Mutation tipada de cadastro.
 */
export function useCreateWalletMutation(
  userId: string,
): UseMutationResult<Wallet, NormalizedHttpError, CreateWalletRequest> {
  const queryClient = useQueryClient();

  return useMutation<Wallet, NormalizedHttpError, CreateWalletRequest>({
    mutationFn: createWallet,
    onSuccess: () => {
      // A lista inteira e refeita, e nao so a carteira criada: promover uma
      // principal REBAIXA a anterior no servidor, e escrever a resposta no
      // cache deixaria duas principais na tela ate o proximo carregamento.
      void queryClient.invalidateQueries({ queryKey: walletsQueryOptions(userId).queryKey });
    },
  });
}

/**
 * Atualiza uma carteira.
 *
 * @param userId - Dono das carteiras.
 * @returns Mutation tipada de atualizacao.
 */
export function useUpdateWalletMutation(
  userId: string,
): UseMutationResult<Wallet, NormalizedHttpError, UpdateWalletVariables> {
  const queryClient = useQueryClient();

  return useMutation<Wallet, NormalizedHttpError, UpdateWalletVariables>({
    mutationFn: ({ walletId, body }) => updateWallet(walletId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: walletsQueryOptions(userId).queryKey });
    },
  });
}
