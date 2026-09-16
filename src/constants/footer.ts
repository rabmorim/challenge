import type { FooterColumn, FooterHighlight, FooterSocial } from '@/types/components';

/**
 * Conteúdo do rodapé, lido do `design/Início.png`.
 *
 * Os links de páginas editoriais e de suporte ficam sem destino: o enunciado §3
 * os exclui da entrega, e apontar para uma rota inexistente seria fluxo apenas
 * visual. Os que têm tela de verdade (perfil, coleções do catálogo) navegam.
 */
export const FOOTER_HIGHLIGHTS: readonly FooterHighlight[] = [
  {
    initial: 'W',
    title: 'Segurança da carteira',
    description: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    initial: 'C',
    title: 'Criadores em destaque',
    description: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    initial: 'D',
    title: 'Alertas de lançamentos',
    description: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
] as const;

/** Blocos de links do rodapé. */
export const FOOTER_COLUMNS: readonly FooterColumn[] = [
  {
    title: 'Meu perfil',
    links: [
      { label: 'Meu perfil', to: '/perfil' },
      { label: 'Meus favoritos', to: '/favoritos' },
      { label: 'Atividade', to: null },
      { label: 'Estúdio do criador', to: null },
      { label: 'Lista de interesse', to: null },
    ],
  },
  {
    title: 'Central de ajuda',
    links: [
      { label: 'Central de ajuda', to: null },
      { label: 'Como comprar NFTs', to: null },
      { label: 'Carteira e segurança', to: null },
      { label: 'Política do mercado', to: null },
      { label: 'Denunciar item', to: null },
    ],
  },
] as const;

/**
 * Coleções que o rodapé lista, na ordem do frame.
 *
 * São ids, não rótulos: o nome de cada uma continua vindo das facetas da API.
 * O recorte é fixo porque o frame escolhe cinco das nove coleções (e não as
 * cinco primeiras) — deixar a coluna crescer com o acervo estouraria a caixa de
 * 1200×610 do rodapé.
 */
export const FOOTER_COLLECTION_IDS: readonly string[] = [
  'digital-art',
  'photography',
  'music',
  'art-3d',
  'utility',
] as const;

/** Redes sociais exibidas no rodapé (perfis fora do escopo da entrega). */
export const FOOTER_SOCIALS: readonly FooterSocial[] = [
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'twitter', label: 'Twitter' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'youtube', label: 'YouTube' },
] as const;

/** Textos fixos do rodapé. */
export const FOOTER_COPY = {
  newsletterTitle: 'Antecipe-se ao próximo lançamento',
  newsletterPlaceholder: 'digite seu e-mail...',
  newsletterLabel: 'E-mail para receber novidades',
  newsletterSubmit: 'Enviar',
  newsletterDescription:
    'Receba lançamentos selecionados, histórias de criadores e novidades do mercado.',
  newsletterOutOfScope: 'A inscrição na newsletter não faz parte desta demonstração.',
  tagline: 'Feito para colecionadores, criadores e cultura',
  email: 'contato@email.com',
  phone: '+55 11 4002 8922',
  collectionsTitle: 'Coleções',
  socialTitle: 'Redes sociais',
  socialOutOfScope: 'Os perfis sociais não fazem parte desta demonstração.',
  walletsTitle: 'Carteiras compatíveis',
  wallets: 'METAMASK · WALLETCONNECT · COINBASE',
  rights: '© 2026 Kurio. Propriedade digital para todos.',
  label: 'Rodapé do site',
} as const;
