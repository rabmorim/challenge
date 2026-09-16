import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useSession } from '@/features/auth/hooks/use-session';
import { walletsQueryOptions } from '@/features/wallets/api/wallets-queries';
import { WALLET_MESSAGES } from '@/features/wallets/constants/wallets-copy';
import { useWalletForm } from '@/features/wallets/hooks/use-wallet-form';
import type { Wallet, WalletRole } from '@/features/wallets/types/wallet';
import type {
  WalletFormValues,
  WalletsApi,
} from '@/features/wallets/types/wallet-state';
import { splitEnsName } from '@/lib/ens-name';
import { isHttpError } from '@/lib/http';
import type { NormalizedHttpError } from '@/types/http';

/**
 * Tela "Carteiras" (`design/Carteiras.png`).
 *
 * O frame tem exatamente dois blocos — principal e secundária — e é assim que a
 * tela lê o recurso: a lista devolvida pela API é reduzida à primeira carteira
 * de cada papel. O servidor já garante que só exista uma principal (promover
 * outra rebaixa a anterior), então não há estado a reconciliar aqui.
 *
 * As carteiras são as MESMAS que o pagamento consome — mesma query key, mesma
 * entrada de cache — então uma carteira salva aqui já está disponível lá, sem
 * nenhuma sincronização entre as telas.
 *
 * @returns Carteiras, os dois blocos do formulário e as ações da tela.
 */
export function useWallets(): WalletsApi {
  const { user } = useSession();
  const userId = user?.id ?? '';

  const { data, isPending, isError, error, refetch } = useQuery(walletsQueryOptions(userId));

  const [announcement, setAnnouncement] = useState('');
  const [isSecondaryOpen, setIsSecondaryOpen] = useState(false);
  const [secondarySeed, setSecondarySeed] = useState<Partial<WalletFormValues> | null>(null);

  const primary = useMemo<Wallet | null>(
    () => data?.items.find((wallet) => wallet.role === 'primary') ?? null,
    [data],
  );

  const secondary = useMemo<Wallet | null>(
    () => data?.items.find((wallet) => wallet.role === 'secondary') ?? null,
    [data],
  );

  const onSaved = useCallback((role: WalletRole, wasEditing: boolean) => {
    const message = wasEditing ? WALLET_MESSAGES.updated(role) : WALLET_MESSAGES.created(role);
    setAnnouncement(message);
    toast.success(message);
    // A semente cumpriu o papel: manter a cópia da principal por baixo faria o
    // bloco voltar a ela no primeiro campo que fosse limpo depois de salvo.
    if (role === 'secondary') setSecondarySeed(null);
  }, []);

  const onFailed = useCallback((failure: NormalizedHttpError | null) => {
    if (!failure) {
      setAnnouncement(WALLET_MESSAGES.invalid);
      return;
    }

    // Erro sem campo (rede, 5xx) não tem onde pousar no formulário: sem o toast
    // ele passaria despercebido por quem enxerga a tela.
    const message = WALLET_MESSAGES.failed(failure.message);
    setAnnouncement(message);
    toast.error(message);
  }, []);

  const primaryForm = useWalletForm({
    role: 'primary',
    wallet: primary,
    seed: null,
    userId,
    onSaved,
    onFailed,
  });

  const secondaryForm = useWalletForm({
    role: 'secondary',
    wallet: secondary,
    seed: secondarySeed,
    userId,
    onSaved,
    onFailed,
  });

  const copyFromPrimary = useCallback(() => {
    if (!primary) return;

    const ens = splitEnsName(primary.ensName);
    // O ENDEREÇO fica de fora: o servidor recusa endereço repetido do mesmo
    // dono, então copiá-lo ofereceria um atalho que aparenta funcionar e falha
    // no envio. O aviso na tela diz isso em uma linha.
    setSecondarySeed({
      displayName: primary.displayName,
      label: primary.label,
      profileName: primary.profileName,
      email: primary.email,
      referralCode: primary.referralCode,
      linkedReference: primary.linkedReference ?? '',
      ensLabel: ens.label,
      ensDomain: ens.domain,
      network: primary.network,
      provider: primary.provider,
    });
    setIsSecondaryOpen(true);
    setAnnouncement(WALLET_MESSAGES.copiedFromPrimary);
  }, [primary]);

  return {
    primary,
    secondary,
    isPending,
    isError,
    error: isHttpError(error) ? error : null,
    refetch: () => {
      void refetch();
    },
    announcement,
    isSecondaryOpen,
    openSecondary: () => {
      setIsSecondaryOpen(true);
    },
    copyFromPrimary,
    isSameAsPrimary: secondarySeed !== null,
    primaryForm,
    secondaryForm,
  };
}
