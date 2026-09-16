import type { NftSummary } from '@/features/catalog/types/nft';

/** Tipos dos componentes compartilhados entre features. */

/** Props do card compacto de NFT usado nos carrosséis. */
export interface NftPreviewCardProps {
  nft: NftSummary;
}

/** Props da fila de bolinhas dos carrosséis. */
export interface CarouselDotsProps {
  /** Página corrente, base 0. */
  page: number;
  pageCount: number;
  onSelect: (page: number) => void;
}

/** Destaque com selo circular no topo do rodapé. */
export interface FooterHighlight {
  /** Letra do selo circular (W / C / D no design). */
  initial: string;
  title: string;
  description: string;
}

/** Link de uma coluna do rodapé; `to` nulo marca destino fora do escopo. */
export interface FooterLink {
  label: string;
  to: string | null;
}

/** Coluna de links do rodapé. */
export interface FooterColumn {
  title: string;
  links: readonly FooterLink[];
}

/** Rede social exibida no rodapé. */
export interface FooterSocial {
  /** Chave do glifo desenhado por `SocialIcon`. */
  id: SocialIconId;
  /** Nome da rede, usado no rótulo acessível. */
  label: string;
}

/** Redes com glifo desenhado no rodapé. */
export type SocialIconId = 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube';

/** Props do glifo de rede social. */
export interface SocialIconProps {
  id: SocialIconId;
  className?: string;
}

/** Glifos exportados do Figma que o pacote de ícones não cobre. */
export type AppIconId = 'cart' | 'logout';

/** Arquivo e medida nativa de um glifo exportado. */
export interface AppIconSpec {
  /** Caminho servido a partir de `public/`. */
  src: string;
  /** Lado (px) do arquivo exportado. */
  size: number;
}

/** Props do glifo exportado do Figma. */
export interface AppIconProps {
  id: AppIconId;
  className?: string;
}


/** Props de uma linha rótulo/valor de um resumo de valores. */
export interface SummaryRowProps {
  label: string;
  value: string;
  /** Realce do total (accent e negrito). */
  isTotal?: boolean;
  /** Nota em accent abaixo do valor ("Taxa estimada"). */
  note?: string;
  /**
   * Onde a nota fica: `end` (sob o valor, como no frame do carrinho) ou
   * `center` (centralizada na largura da coluna, como no do pagamento).
   */
  noteAlign?: 'end' | 'center';
}
