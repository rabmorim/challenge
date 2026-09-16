import type { ComponentProps } from 'react';

/**
 * Moldura comum dos icones de senha.
 *
 * Centraliza os atributos do traco (`stroke`, espessura, terminacoes) para que
 * os dois estados desenhem exatamente o mesmo peso de linha.
 *
 * @param props - Props nativas de `svg` (tamanho e cor vem do CSS).
 */
function PasswordIconFrame({ children, ...props }: ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/**
 * Olho aberto — senha visivel.
 *
 * @param props - Props nativas de `svg`.
 */
export function EyeVisibleIcon(props: ComponentProps<'svg'>) {
  return (
    <PasswordIconFrame {...props}>
      <path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0" />
      <circle cx="12" cy="12" r="3" />
    </PasswordIconFrame>
  );
}

/**
 * Olho cortado — senha oculta.
 *
 * O corte sobe da esquerda para a direita, ao contrario do `eye-off` do lucide:
 * e a diagonal desenhada no Figma, e por isso o icone e proprio em vez de vir
 * da biblioteca.
 *
 * @param props - Props nativas de `svg`.
 */
export function EyeHiddenIcon(props: ComponentProps<'svg'>) {
  return (
    <PasswordIconFrame {...props}>
      <path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0" />
      <circle cx="12" cy="12" r="3" />
      <path d="M22 2 2 22" />
    </PasswordIconFrame>
  );
}
