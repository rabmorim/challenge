import { Decimal } from 'decimal.js';

import type { EthAmount } from '@/types/api';

/** Casas decimais exibidas para valores em ETH nas telas. */
const DISPLAY_DECIMAL_PLACES = 2;

/** Precisao interna usada nas somas e multiplicacoes antes do arredondamento. */
const WORKING_PRECISION = 30;

/** Casas decimais em que o servidor arredonda os valores (ver `quantizeEth`). */
const QUANTIZE_DECIMAL_PLACES = 6;

Decimal.set({ precision: WORKING_PRECISION, rounding: Decimal.ROUND_HALF_UP });

/**
 * Soma valores em ETH sem perder precisao.
 *
 * @param amounts - Strings decimais a somar.
 * @returns String decimal com o total.
 */
export function sumEth(amounts: readonly EthAmount[]): EthAmount {
  return amounts.reduce((total, amount) => new Decimal(total).plus(amount), new Decimal(0)).toFixed();
}

/**
 * Multiplica um valor em ETH por uma quantidade inteira.
 *
 * @param amount - String decimal do preco unitario.
 * @param quantity - Quantidade inteira de unidades.
 * @returns String decimal do subtotal.
 * @throws {RangeError} Quando `quantity` nao e um inteiro nao negativo.
 */
export function multiplyEth(amount: EthAmount, quantity: number): EthAmount {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new RangeError(`Quantidade invalida: ${String(quantity)}. Esperado inteiro >= 0.`);
  }
  return new Decimal(amount).times(quantity).toFixed();
}

/**
 * Subtrai um valor em ETH de outro.
 *
 * @param amount - String decimal do minuendo.
 * @param subtrahend - String decimal do subtraendo.
 * @returns String decimal da diferenca.
 */
export function subtractEth(amount: EthAmount, subtrahend: EthAmount): EthAmount {
  return new Decimal(amount).minus(subtrahend).toFixed();
}

/**
 * Compara dois valores em ETH.
 *
 * @param a - Primeira string decimal.
 * @param b - Segunda string decimal.
 * @returns `-1`, `0` ou `1`, no padrao de comparadores.
 */
export function compareEth(a: EthAmount, b: EthAmount): -1 | 0 | 1 {
  return new Decimal(a).comparedTo(b) as -1 | 0 | 1;
}

/**
 * Formata um valor em ETH para exibicao, com casas fixas e sufixo da moeda.
 *
 * @param amount - String decimal vinda da API.
 * @param options - `withSuffix` controla o sufixo " ETH" (padrao: `true`).
 * @returns Texto pronto para a interface, ex.: `"1.19 ETH"`.
 */
export function formatEth(amount: EthAmount, options?: { withSuffix?: boolean }): string {
  const value = new Decimal(amount).toFixed(DISPLAY_DECIMAL_PLACES, Decimal.ROUND_HALF_UP);
  return options?.withSuffix === false ? value : `${value} ETH`;
}

/**
 * Formata um valor em ETH preservando a precisao que a API enviou.
 *
 * O resumo do carrinho precisa disso: o frame escreve `0.016 ETH` na taxa de
 * rede e `26.846 ETH` no total, enquanto o subtotal aparece como `26.83 ETH`.
 * Nao sao formatos diferentes — e o mesmo valor canonico do servidor, que
 * `quantizeEth` ja entrega sem zeros a direita. Arredondar tudo em duas casas
 * (como `formatEth` faz nos precos) esconderia a taxa e mudaria o total.
 *
 * O piso de duas casas existe para `26.8` nao virar `26.8 ETH` ao lado de
 * `1.19 ETH`; o teto acompanha a precisao de calculo do servidor.
 *
 * @param amount - String decimal vinda da API.
 * @returns Texto pronto para a interface, ex.: `"26.846 ETH"`.
 */
export function formatEthPrecise(amount: EthAmount): string {
  const value = new Decimal(amount);
  const places = Math.min(
    Math.max(DISPLAY_DECIMAL_PLACES, value.decimalPlaces()),
    QUANTIZE_DECIMAL_PLACES,
  );

  return `${value.toFixed(places, Decimal.ROUND_HALF_UP)} ETH`;
}

/**
 * Calcula um percentual de um valor em ETH.
 * Usado pelo desconto de cupom, que a API entrega como percentual em string.
 *
 * @param amount - String decimal do valor base.
 * @param percent - Percentual como string decimal, ex.: `"10"`.
 * @returns String decimal do valor correspondente ao percentual.
 */
export function percentageOfEth(amount: EthAmount, percent: string): EthAmount {
  return new Decimal(amount).times(percent).dividedBy(100).toFixed();
}

/**
 * Arredonda um valor em ETH para a precisao de calculo do servidor.
 *
 * Mantem os totais estaveis (subtotal - desconto + taxa = total) sem arrastar
 * dizimas de um percentual, e sem zeros a direita: o valor continua canonico
 * (`"2.38"`, nunca `"2.380000"`), o que faz a comparacao entre carrinho,
 * cotacao e pedido ser textual e exata.
 *
 * @param amount - String decimal a arredondar.
 * @param decimalPlaces - Casas decimais mantidas (padrao: 6).
 * @returns String decimal arredondada, sem zeros a direita.
 */
export function quantizeEth(amount: EthAmount, decimalPlaces = QUANTIZE_DECIMAL_PLACES): EthAmount {
  return new Decimal(amount).toDecimalPlaces(decimalPlaces, Decimal.ROUND_HALF_UP).toFixed();
}
