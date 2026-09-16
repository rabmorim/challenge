import type { CatalogSearch } from '@/features/catalog/types/catalog-search';

/** Cartão de promoção da Início, com o recorte de catálogo que ele abre. */
export interface PromoCard {
  title: string;
  description: string;
  cta: string;
  to: string;
  /** Estado de URL aplicado ao catálogo quando o CTA é acionado. */
  search: CatalogSearch;
  /**
   * Posição, na lista de destaques da API, da arte que o cartão exibe.
   * O frame não segue a ordem da lista, então a escolha fica declarada aqui em
   * vez de nascer do índice do cartão.
   */
  artworkIndex: number;
}

/** Cartão do "Diário da Cunhagem" (conteúdo editorial, fora do escopo). */
export interface JournalEntry {
  date: string;
  readingTime: string;
  title: string;
  description: string;
  imageUrl: string;
}
