import { DEFAULT_ENS_DOMAIN, ENS_DOMAIN_OPTIONS } from '@/constants/ens';

/**
 * Composicao e decomposicao do nome ENS.
 *
 * O contrato guarda o nome inteiro (`nova.kurio.eth`), mas o layout do perfil e
 * o das carteiras o editam em DOIS controles: um seletor de dominio e um campo
 * de texto. Converter nas bordas do formulario — e nao guardar as duas metades
 * no recurso — mantem o transporte com um campo so e deixa a divisao onde ela
 * de fato existe, que e a tela.
 */

/** Nome ENS decomposto nos dois controles do layout. */
export interface EnsNameParts {
  /** Rotulo digitado, sem o ponto (ex.: `nova`). */
  label: string;
  /** Dominio escolhido no seletor, com o ponto (ex.: `.kurio.eth`). */
  domain: string;
}

/**
 * Separa um nome ENS no rotulo e no dominio do seletor.
 *
 * Casa o dominio mais longo primeiro: `nova.kurio.eth` tem `.kurio.eth` e
 * `.eth` como sufixos validos, e o segundo deixaria um ponto sobrando no
 * rotulo. Nome que nao termina em nenhum dominio conhecido vira rotulo inteiro
 * com o dominio padrao — nao ha por que perder o que o usuario digitou.
 *
 * @param ensName - Nome completo, ou `null` quando a carteira nao tem um.
 * @returns Rotulo e dominio prontos para os dois controles.
 */
export function splitEnsName(ensName: string | null): EnsNameParts {
  const value = ensName?.trim().toLowerCase() ?? '';
  if (value.length === 0) return { label: '', domain: DEFAULT_ENS_DOMAIN };

  const domain = ENS_DOMAIN_OPTIONS.toSorted(
    (left, right) => right.length - left.length,
  ).find((candidate) => value.endsWith(candidate));

  if (!domain) return { label: value, domain: DEFAULT_ENS_DOMAIN };

  return { label: value.slice(0, value.length - domain.length), domain };
}

/**
 * Junta rotulo e dominio no nome que o contrato transporta.
 *
 * @param parts - Rotulo digitado e dominio escolhido.
 * @returns Nome completo, ou `null` quando o rotulo esta em branco (o contrato
 *   distingue "sem ENS" de texto vazio).
 */
export function joinEnsName(parts: EnsNameParts): string | null {
  const label = parts.label.trim().toLowerCase();
  if (label.length === 0) return null;
  return `${label}${parts.domain}`;
}
