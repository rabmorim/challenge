import type { FormStatusProps } from '@/features/auth/types/auth-components';

/**
 * Regiao viva com o resultado do envio do formulario.
 *
 * Existe sempre no DOM, mesmo vazia: uma regiao `aria-live` criada junto com a
 * mensagem costuma nao ser anunciada, porque o leitor de tela precisa ja estar
 * observando o elemento quando o conteudo muda.
 *
 * @param props - Mensagem a anunciar.
 */
export function FormStatus({ message }: FormStatusProps) {
  return (
    <p role="alert" aria-live="assertive" className="text-destructive text-body min-h-6 text-center">
      {message}
    </p>
  );
}
