import type { NftSummary } from '@/features/catalog/types/nft';
import type { EditionOption } from '@/features/nft-detail/types/detail-components';
import type { Quantity } from '@/types/api';

/** Quantidade escolhida no detalhe, já limitada pela edição. */
export interface QuantitySelection {
  quantity: Quantity;
  /** Menor valor entre o limite por pedido e as unidades disponíveis. */
  max: Quantity;
  setQuantity: (value: Quantity) => void;
}

/** Edições irmãs e itens relacionados da coleção. */
export interface EditionOptions {
  options: EditionOption[];
  /** Demais itens da coleção, para "Mais desta coleção". */
  related: NftSummary[];
  isPending: boolean;
}

/** Decisão comum aos botões de compra do detalhe. */
export interface BuyIntent {
  /** Edição sem unidades à venda. */
  isSoldOut: boolean;
  /** `true` quando o botão não pode agir — esgotado ou com inclusão em voo. */
  isDisabled: boolean;
  /** Rótulo do botão do painel de 1440. */
  label: string;
  /**
   * Inclui no carrinho, ou abre o painel de autenticação quando não há sessão.
   * Nunca conclui uma compra: isso é da etapa do pagamento.
   */
  trigger: () => void;
}
