import { ADDRESS_MASK } from '@/features/checkout/constants/checkout';
import { WALLET_COPY } from '@/features/checkout/constants/checkout-copy';
import type { Wallet } from '@/features/wallets/types/wallet';

/**
 * Apresentacao de carteiras e transacoes.
 *
 * O frame exibe `0xA91F…E82C` no lugar do endereco inteiro, e o nome ENS
 * quando a carteira tem um — e o que identifica a carteira para quem esta
 * comprando, sem uma linha de 42 caracteres no meio do cartao.
 */

/**
 * Mascara um endereco ou hash no formato do frame.
 *
 * @param value - Endereco `0x...` ou hash de transacao.
 * @returns Texto mascarado, ou o proprio valor quando ja e curto.
 */
export function maskAddress(value: string): string {
  const cutoff = ADDRESS_MASK.prefix + ADDRESS_MASK.suffix;
  if (value.length <= cutoff) return value;

  return `${value.slice(0, ADDRESS_MASK.prefix)}…${value.slice(-ADDRESS_MASK.suffix)}`;
}

/**
 * Texto que identifica uma carteira na tela.
 * O nome ENS tem precedencia porque e o que o usuario reconhece.
 *
 * @param wallet - Carteira cadastrada.
 * @returns Nome ENS ou endereco mascarado.
 */
export function walletIdentity(wallet: Wallet): string {
  return wallet.ensName ?? maskAddress(wallet.address);
}

/**
 * Traduz o estado de conexao de uma carteira para exibicao.
 * O estado nao depende so de cor: ele vem escrito ao lado do apelido.
 *
 * @param wallet - Carteira cadastrada.
 * @returns Texto do estado, pronto para a interface.
 */
export function walletStatusLabel(wallet: Wallet): string {
  if (wallet.status === 'connected') return WALLET_COPY.statusConnected;
  if (wallet.status === 'refused') return WALLET_COPY.statusRefused;
  return WALLET_COPY.statusDisconnected;
}
