import { API_PATHS } from '@/constants/api';
import type {
  CreateWalletRequest,
  UpdateWalletRequest,
  Wallet,
  WalletsResponse,
} from '@/features/wallets/types/wallet';
import { httpClient } from '@/lib/http';

/**
 * Chamadas REST de carteiras. Todas exigem sessao.
 * A conexao, a recusa e a desconexao sao simuladas pelo campo `status` — nao ha
 * extensao de carteira real no escopo do desafio.
 */

/**
 * Lista as carteiras do usuario autenticado.
 *
 * @param signal - `AbortSignal` do TanStack Query.
 * @returns Carteiras cadastradas.
 */
export async function fetchWallets(signal?: AbortSignal): Promise<WalletsResponse> {
  const { data } = await httpClient.get<WalletsResponse>(API_PATHS.wallets, signal ? { signal } : undefined);
  return data;
}

/**
 * Cadastra uma carteira.
 *
 * @param body - Apelido, provedor, papel, endereco e rede.
 * @returns Carteira criada.
 * @throws {NormalizedHttpError} `VALIDATION_ERROR` nos campos invalidos e
 *   `CONFLICT` quando o endereco ja esta cadastrado.
 */
export async function createWallet(body: CreateWalletRequest): Promise<Wallet> {
  const { data } = await httpClient.post<Wallet>(API_PATHS.wallets, body);
  return data;
}

/**
 * Atualiza uma carteira (envio parcial).
 *
 * @param walletId - Id da carteira.
 * @param body - Campos a alterar, inclusive `status` (conexao/recusa/desconexao).
 * @returns Carteira atualizada.
 */
export async function updateWallet(walletId: string, body: UpdateWalletRequest): Promise<Wallet> {
  const { data } = await httpClient.patch<Wallet>(API_PATHS.walletById(walletId), body);
  return data;
}
