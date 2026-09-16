import { describe, expect, it } from 'vitest';

import { login } from '@/features/auth/api/auth-api';
import {
  changePassword,
  fetchProfile,
  removeAvatar,
  updateAvatar,
  updateProfile,
} from '@/features/profile/api/profile-api';
import { createWallet, fetchWallets, updateWallet } from '@/features/wallets/api/wallets-api';
import type { CreateWalletRequest } from '@/features/wallets/types/wallet';
import { selectScenario } from '@/test/mock-control';

/**
 * Perfil e carteiras: leitura, atualizacao, validacao, conflito e isolamento
 * por usuario.
 */
describe('perfil', () => {
  it('devolve o perfil com os contadores do proprio usuario', async () => {
    await login({ email: 'ana@kurio.dev', password: 'kurio1234' });
    const profile = await fetchProfile();

    expect(profile).toMatchObject({
      username: 'ana.colecionadora',
      displayName: 'Ana Ribeiro',
      ensName: 'ana.eth',
      walletLabel: 'Cofre da Ana',
      stats: { ownedCount: 1, favoritesCount: 2, ordersCount: 1 },
    });
  });

  it('atualiza dados e avatar', async () => {
    await login({ email: 'ana@kurio.dev', password: 'kurio1234' });

    const updated = await updateProfile({ displayName: 'Ana R.', bio: 'Colecionadora' });
    expect(updated).toMatchObject({ displayName: 'Ana R.', bio: 'Colecionadora' });

    const withAvatar = await updateAvatar({ avatarDataUrl: 'data:image/png;base64,iVBORw0KGgo=' });
    expect(withAvatar.avatarUrl).toContain('data:image/png');

    // Remover deixa a conta SEM avatar, e nao com o retrato generico.
    const without = await removeAvatar();
    expect(without.avatarUrl).toBe('');
  });

  it('atualiza nome ENS e apelido da carteira, e valida o formato do ENS', async () => {
    await login({ email: 'ana@kurio.dev', password: 'kurio1234' });

    const updated = await updateProfile({ ensName: 'Ana.Kurio.Eth', walletLabel: 'Cofre novo' });
    expect(updated).toMatchObject({ ensName: 'ana.kurio.eth', walletLabel: 'Cofre novo' });

    await expect(updateProfile({ ensName: 'sem-dominio' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      fieldErrors: { ensName: expect.any(String) },
    });

    // `null` explicito remove o ENS da conta.
    const cleared = await updateProfile({ ensName: null });
    expect(cleared.ensName).toBeNull();
  });

  it('recusa e-mail ja usado por outra conta', async () => {
    await login({ email: 'ana@kurio.dev', password: 'kurio1234' });

    await expect(updateProfile({ email: 'bruno@kurio.dev' })).rejects.toMatchObject({
      code: 'CONFLICT',
      reason: 'EMAIL_ALREADY_REGISTERED',
    });
  });

  it('valida a troca de senha e aceita a nova credencial', async () => {
    await login({ email: 'ana@kurio.dev', password: 'kurio1234' });

    await expect(
      changePassword({
        currentPassword: 'errada',
        newPassword: 'curta',
        newPasswordConfirmation: 'outra',
      }),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      fieldErrors: {
        currentPassword: expect.any(String),
        newPassword: expect.any(String),
        newPasswordConfirmation: expect.any(String),
      },
    });

    await changePassword({
      currentPassword: 'kurio1234',
      newPassword: 'kurio56789',
      newPasswordConfirmation: 'kurio56789',
    });

    const session = await login({ email: 'ana@kurio.dev', password: 'kurio56789' });
    expect(session.user.email).toBe('ana@kurio.dev');
  });
});

/**
 * Corpo valido de cadastro de carteira.
 * Os campos do frame sao todos obrigatorios; o teste declara uma base e
 * sobrescreve so o que cada caso exercita.
 *
 * @param overrides - Campos que o caso troca.
 * @returns Corpo pronto para `createWallet`.
 */
function walletBody(overrides: Partial<CreateWalletRequest> = {}): CreateWalletRequest {
  return {
    label: 'Carteira nova',
    displayName: 'Ana Ribeiro',
    profileName: 'ana.colecionadora',
    email: 'ana@kurio.dev',
    referralCode: 'KURIO-ANA9',
    provider: 'coinbase',
    role: 'primary',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    ensName: null,
    linkedReference: null,
    network: 'ethereum',
    ...overrides,
  };
}

describe('carteiras', () => {
  it('lista apenas as carteiras do usuario autenticado', async () => {
    await login({ email: 'ana@kurio.dev', password: 'kurio1234' });
    const ana = await fetchWallets();

    await login({ email: 'bruno@kurio.dev', password: 'kurio4321' });
    const bruno = await fetchWallets();

    expect(ana.items.map((wallet) => wallet.id)).toEqual([
      'wallet-ana-primary',
      'wallet-ana-secondary',
    ]);
    expect(bruno.items).toHaveLength(1);
    expect(bruno.items[0]?.id).toBe('wallet-bruno-primary');
  });

  it('cadastra carteira e rebaixa a principal anterior', async () => {
    await login({ email: 'ana@kurio.dev', password: 'kurio1234' });

    const created = await createWallet(walletBody());

    expect(created).toMatchObject({ role: 'primary', status: 'connected' });

    const wallets = await fetchWallets();
    const previous = wallets.items.find((wallet) => wallet.id === 'wallet-ana-primary');
    expect(previous?.role).toBe('secondary');
  });

  it('valida endereco e recusa endereco repetido', async () => {
    await login({ email: 'ana@kurio.dev', password: 'kurio1234' });

    await expect(
      createWallet(
        walletBody({
          label: 'x',
          referralCode: 'ab',
          email: 'sem-arroba',
          provider: 'metamask',
          role: 'secondary',
          address: '0x123',
        }),
      ),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      fieldErrors: {
        label: expect.any(String),
        address: expect.any(String),
        email: expect.any(String),
        referralCode: expect.any(String),
      },
    });

    await expect(
      createWallet(
        walletBody({
          label: 'Duplicada',
          provider: 'metamask',
          role: 'secondary',
          address: '0xA91F7c3b0d5e2481a6f09c4b7d3e150f9a26E82C',
        }),
      ),
    ).rejects.toMatchObject({ reason: 'WALLET_ADDRESS_ALREADY_REGISTERED' });
  });

  it('simula conexao, recusa e desconexao pelo status', async () => {
    await login({ email: 'ana@kurio.dev', password: 'kurio1234' });

    const refused = await updateWallet('wallet-ana-secondary', { status: 'refused' });
    expect(refused.status).toBe('refused');

    const connected = await updateWallet('wallet-ana-secondary', { status: 'connected' });
    expect(connected.status).toBe('connected');
  });

  it('nao permite atualizar carteira de outro usuario', async () => {
    await login({ email: 'bruno@kurio.dev', password: 'kurio4321' });

    await expect(updateWallet('wallet-ana-primary', { label: 'Invadida' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});

describe('conexao simulada da carteira', () => {
  it('conecta e desconecta a carteira cadastrada', async () => {
    await login({ email: 'ana@kurio.dev', password: 'kurio1234' });

    const connected = await updateWallet('wallet-ana-secondary', { status: 'connected' });
    expect(connected.status).toBe('connected');
    // O nome ENS da fixture e o que o frame de 414 exibe no lugar do endereco.
    expect(connected.ensName).toBe('nova.kurio.eth');

    const disconnected = await updateWallet('wallet-ana-secondary', { status: 'disconnected' });
    expect(disconnected.status).toBe('disconnected');
  });

  it('recusa a conexao no cenario correspondente e deixa a carteira recusada', async () => {
    await selectScenario('wallet-refused');
    await login({ email: 'ana@kurio.dev', password: 'kurio1234' });

    await expect(
      updateWallet('wallet-ana-secondary', { status: 'connected' }),
    ).rejects.toMatchObject({ code: 'CONFLICT', reason: 'WALLET_UNAVAILABLE' });

    // A recusa e real: o estado persiste, entao a interface nao mostra sucesso.
    const { items } = await fetchWallets();
    const wallet = items.find((candidate) => candidate.id === 'wallet-ana-secondary');
    expect(wallet?.status).toBe('refused');
  });
});
