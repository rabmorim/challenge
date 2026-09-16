import type { Wallet, WalletRole } from '@/features/wallets/types/wallet';
import type { WalletFormValues } from '@/features/wallets/types/wallet-state';
import type { NormalizedHttpError } from '@/types/http';

/** Opcoes de `useWalletForm` — um bloco de carteira do frame. */
export interface UseWalletFormOptions {
  /** Papel do bloco: principal ou secundaria. */
  role: WalletRole;
  /** Carteira ja cadastrada neste papel, ou `null` quando o bloco e de cadastro. */
  wallet: Wallet | null;
  /**
   * Valores sugeridos por baixo do que foi digitado.
   * E o que o atalho "Igual a carteira principal" injeta — sem o endereco, que
   * nao pode repetir.
   */
  seed: Partial<WalletFormValues> | null;
  /** Dono das carteiras (entra na query key do ramo privado). */
  userId: string;
  /**
   * Avisa que a carteira foi gravada.
   *
   * @param role - Papel do bloco salvo.
   * @param wasEditing - `true` quando foi atualizacao, `false` no cadastro.
   */
  onSaved: (role: WalletRole, wasEditing: boolean) => void;
  /**
   * Avisa que o envio falhou.
   *
   * @param error - Erro sem campo associado (rede, 5xx), ou `null` quando o
   *   problema ja esta apontado nos campos do formulario.
   */
  onFailed: (error: NormalizedHttpError | null) => void;
}
