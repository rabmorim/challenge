import type { NftDetail, NftSummary } from '@/features/catalog/types/nft';
import type { Quantity } from '@/types/api';

/** Props da galeria (miniaturas + arte principal). */
export interface NftGalleryProps {
  images: string[];
  alt: string;
  name: string;
}

/** Edição selecionável do detalhe — um item irmão da mesma coleção. */
export interface EditionOption {
  nftId: string;
  slug: string;
  name: string;
  /** Unidades cunhadas; é o que o chip mostra (`1/50`). */
  total: Quantity;
  available: Quantity;
  isCurrent: boolean;
}

/** Props do seletor de edição. */
export interface EditionSelectorProps {
  options: EditionOption[];
  /** Disponibilidade da edição corrente, que define o chip de estado. */
  available: Quantity;
  isPending: boolean;
}

/** Props do seletor de quantidade. */
export interface QuantityStepperProps {
  value: Quantity;
  max: Quantity;
  onChange: (value: Quantity) => void;
  /** `compact` é a variante da barra fixa do celular. */
  variant?: 'default' | 'compact';
}

/** Props das ações de compra do detalhe. */
export interface BuyActionsProps {
  nft: NftDetail;
  quantity: Quantity;
}

/** Props do painel de informações do detalhe. */
export interface NftInfoPanelProps {
  nft: NftDetail;
}

/** Props da nota em estrelas. */
export interface StarRatingProps {
  /** Média em string decimal, como a API entrega. */
  average: string;
  /** Total de avaliações; omitido quando a nota é de uma avaliação só. */
  count?: number;
  /** `true` exibe a média em texto ao lado (variante do frame mobile). */
  withValue?: boolean;
}

/** Props da linha de compartilhamento. */
export interface ShareLinksProps {
  /** Nome do NFT, usado no assunto do e-mail e na folha do sistema. */
  name: string;
}

/** Props da lista de avaliações. */
export interface ReviewListProps {
  reviews: NftDetail['reviews'];
  rating: NftDetail['rating'];
}

/** Props da tela de detalhe. */
export interface NftDetailScreenProps {
  /** Id ou slug vindo da rota. */
  nftId: string;
}

/** Props da composição do detalhe no frame de 1440. */
export interface NftDetailDesktopProps {
  nft: NftDetail;
}

/** Props do carrossel "Mais desta coleção". */
export interface RelatedCollectionProps {
  items: NftSummary[];
  isPending: boolean;
}


/** Props da composição do detalhe no frame de 414. */
export interface NftDetailMobileProps {
  nft: NftDetail;
}

/** Props da arte sangrada do frame de 414. */
export interface DetailArtProps {
  /** Imagens da galeria; a primeira é a arte exibida. */
  images: string[];
  alt: string;
  name: string;
}

/** Props da linha de voltar e favoritar sobre a arte. */
export interface DetailTopBarProps {
  nft: NftDetail;
}

/** Props da folha de informações do frame de 414. */
export interface DetailSummaryProps {
  nft: NftDetail;
}

/** Props do selo de nota do frame de 414. */
export interface RatingBadgeProps {
  /** Média em string decimal, como a API entrega. */
  average: string;
  count: number;
}

/** Props da barra fixa de compra do frame de 414. */
export interface BuyBarProps {
  nft: NftDetail;
}

/** Props da nota que explica o estado do botão de compra. */
export interface BuyNoteProps {
  /** Id referenciado pelo `aria-describedby` dos botões. */
  id: string;
  nft: NftDetail;
  quantity: Quantity;
}
