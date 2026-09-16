import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import { walletsQueryOptions } from '@/features/wallets/api/wallets-queries';
import { WALLET_COPY } from '@/features/checkout/constants/checkout-copy';
import { updateWallet } from '@/features/wallets/api/wallets-api';
import type { Wallet, WalletProvider, WalletsResponse } from '@/features/wallets/types/wallet';
import type {
  WalletSelection,
  WalletSelectionApi,
} from '@/features/checkout/types/checkout-state';
import { isHttpError } from '@/lib/http';
import type { NormalizedHttpError } from '@/types/http';

/**
 * Carteiras do colecionador na tela de pagamento.
 *
 * Aqui o recurso é apenas **lido**: cadastro e edição pertencem à tela de
 * carteiras. A única escrita é o `status`, que é como a simulação representa
 * conectar e desconectar — não há extensão de carteira real no escopo, e a
 * conexão precisa mesmo assim ter as três saídas possíveis.
 *
 * **A recusa é real.** Quando a simulação nega a conexão, o servidor grava a
 * carteira como `refused` e responde `409 WALLET_UNAVAILABLE`; a tela mostra o
 * estado verdadeiro e o pedido com essa carteira não passa. Nada de sucesso
 * falso — que é o que o enunciado proíbe para ações fora do escopo.
 *
 * **Provedor e carteira são a mesma escolha.** O bloco "Carteira e rede" marca
 * um provedor; quem paga é a carteira cadastrada daquele provedor. Sem carteira
 * correspondente, a seleção fica sem dona de propósito — e a tela diz isso, em
 * vez de fingir que há uma conexão.
 *
 * A seleção é **derivada**, não copiada: o estado guarda apenas a intenção do
 * usuário (`auto` até ele escolher), e a carteira sai dela mais a lista que
 * chegou do servidor. Um efeito que escolhesse a carteira padrão quando a lista
 * carrega teria que decidir se sobrescreve uma escolha feita nesse meio-tempo.
 *
 * Conectar e desconectar são mutations, e como toda mutation do projeto elas
 * falam pela região viva: quem não enxerga precisa saber que a carteira mudou
 * de estado, e não só ver a palavra trocar na tela.
 *
 * @param userId - Dono das carteiras.
 * @param announce - Publica o resultado na região viva da tela.
 * @returns Carteiras, seleção corrente e as ações simuladas de conexão.
 */
export function useWalletSelection(
  userId: string,
  announce: (message: string) => void,
): WalletSelectionApi {
  const queryClient = useQueryClient();
  const query = useQuery(walletsQueryOptions(userId));

  const [selection, setSelection] = useState<WalletSelection>({ kind: 'auto' });
  const [connectionError, setConnectionError] = useState<NormalizedHttpError | null>(null);
  const [pendingWalletId, setPendingWalletId] = useState<string | null>(null);

  const wallets = useMemo(() => query.data?.items ?? [], [query.data]);

  const selected = useMemo(() => {
    if (selection.kind === 'wallet') {
      return wallets.find((wallet) => wallet.id === selection.walletId) ?? null;
    }

    if (selection.kind === 'provider') {
      return wallets.find((wallet) => wallet.provider === selection.provider) ?? null;
    }

    // Escolha inicial: a principal conectada é a que o frame mostra marcada.
    // Cai para a principal e depois para a primeira da lista, porque uma
    // carteira desconectada ainda pode ser escolhida — ela só precisa conectar.
    return (
      wallets.find((wallet) => wallet.role === 'primary' && wallet.status === 'connected') ??
      wallets.find((wallet) => wallet.role === 'primary') ??
      wallets.at(0) ??
      null
    );
  }, [selection, wallets]);

  /**
   * Publica a carteira atualizada na lista em cache.
   *
   * @param wallet - Carteira como o servidor a devolveu.
   */
  const replaceWallet = useCallback(
    (wallet: Wallet) => {
      queryClient.setQueryData<WalletsResponse>(walletsQueryOptions(userId).queryKey, (current) =>
        current
          ? { items: current.items.map((item) => (item.id === wallet.id ? wallet : item)) }
          : current,
      );
    },
    [queryClient, userId],
  );

  const statusMutation = useMutation({
    mutationFn: ({ wallet, status }: { wallet: Wallet; status: Wallet['status'] }) =>
      updateWallet(wallet.id, { status }),
    onMutate: ({ wallet }) => {
      setPendingWalletId(wallet.id);
      setConnectionError(null);
    },
    onSuccess: (wallet) => {
      replaceWallet(wallet);
      announce(
        wallet.status === 'connected'
          ? WALLET_COPY.announceConnected(wallet.label)
          : WALLET_COPY.announceDisconnected(wallet.label),
      );
    },
    onError: (error: unknown) => {
      const normalized = isHttpError(error) ? error : null;
      setConnectionError(normalized);
      if (normalized) announce(normalized.message);
      // A recusa muda o estado da carteira no servidor: reler é o que faz a
      // tela mostrar "conexão recusada" em vez de continuar dizendo
      // "desconectada".
      void queryClient.invalidateQueries({ queryKey: walletsQueryOptions(userId).queryKey });
    },
    onSettled: () => {
      setPendingWalletId(null);
    },
  });

  const select = useCallback((walletId: string) => {
    setConnectionError(null);
    setSelection({ kind: 'wallet', walletId });
  }, []);

  const selectProvider = useCallback((provider: WalletProvider) => {
    setConnectionError(null);
    setSelection({ kind: 'provider', provider });
  }, []);

  const connect = useCallback(
    (wallet: Wallet) => {
      if (statusMutation.isPending) return;
      statusMutation.mutate({ wallet, status: 'connected' });
    },
    [statusMutation],
  );

  const disconnect = useCallback(
    (wallet: Wallet) => {
      if (statusMutation.isPending) return;
      statusMutation.mutate({ wallet, status: 'disconnected' });
    },
    [statusMutation],
  );

  return {
    wallets,
    selected,
    provider: selected?.provider ?? (selection.kind === 'provider' ? selection.provider : null),
    isPending: query.isPending,
    isError: query.isError,
    error: isHttpError(query.error) ? query.error : null,
    pendingWalletId,
    connectionError,
    select,
    selectProvider,
    connect,
    disconnect,
    refetch: () => {
      void query.refetch();
    },
  };
}
