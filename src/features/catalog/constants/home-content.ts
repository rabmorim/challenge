import { ROUTES } from '@/constants/routes';
import type { CatalogSearch } from '@/features/catalog/types/catalog-search';
import type { JournalEntry, PromoCard } from '@/features/catalog/types/home-content';

/**
 * Conteúdo editorial da Início, lido do `design/Início.png`.
 *
 * Os dois cartões de promoção apontam para recortes reais do catálogo: o CTA
 * monta o mesmo estado de URL que a sidebar montaria, então "Explorar" leva a
 * uma listagem de verdade, com filtro aplicado e compartilhável por link.
 */
export const PROMO_CARDS: readonly PromoCard[] = [
  {
    title: 'Lançamentos gênesis de edição limitada',
    description: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    cta: 'Explorar',
    to: ROUTES.marketplace,
    search: { rarities: ['legendary'] } satisfies CatalogSearch,
    // No `design/Início.png` este cartão usa a arte do herói.
    artworkIndex: 0,
  },
  {
    title: 'Arte digital selecionada e muito mais',
    description: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura da internet.',
    cta: 'Explorar',
    to: ROUTES.marketplace,
    search: { tab: 'new' } satisfies CatalogSearch,
    // E o segundo usa a terceira arte do frame (blazer marfim).
    artworkIndex: 2,
  },
] as const;

/**
 * Cartões do "Diário da Cunhagem".
 *
 * São editoriais — o enunciado §3 tira páginas de conteúdo do escopo —, então o
 * texto é fixo e "Ler mais" avisa que o artigo não faz parte da demonstração,
 * em vez de abrir uma tela que não existe. A arte reaproveita as peças do Figma.
 */
export const JOURNAL_ENTRIES: readonly JournalEntry[] = [
  {
    date: '12 de setembro',
    readingTime: 'Leitura de 6 min',
    title: 'Como funciona a propriedade de NFTs',
    description: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    imageUrl: '/nfts/neon-vessel-552.png',
  },
  {
    date: '13 de setembro',
    readingTime: 'Leitura de 2 min',
    title: '10 artistas digitais para acompanhar',
    description: 'Conheça criadores que moldam a cultura digital.',
    imageUrl: '/nfts/emerald-ape-042.png',
  },
  {
    date: '15 de setembro',
    readingTime: 'Leitura de 3 min',
    title: 'Raridade, atributos e procedência',
    description: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    imageUrl: '/nfts/sage-nomad-009.png',
  },
  {
    date: '15 de setembro',
    readingTime: 'Leitura de 2 min',
    title: 'Como proteger sua carteira',
    description: 'Proteja sua carteira, seus ativos e sua identidade.',
    imageUrl: '/nfts/golden-beat-207.png',
  },
] as const;

/** Aviso exibido ao acionar um artigo do diário. */
export const JOURNAL_OUT_OF_SCOPE = 'Os artigos do diário não fazem parte desta demonstração.';
