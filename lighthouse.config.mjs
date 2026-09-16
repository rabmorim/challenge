/**
 * Configuracao versionada da auditoria Lighthouse.
 *
 * As paginas auditadas sao as que o enunciado §10 pede: a Inicio e o detalhe
 * do NFT, nos perfis mobile e desktop, com o cenario padrao dos mocks.
 */
export const LIGHTHOUSE_CONFIG = {
  /** Origem servida por `vite preview` durante a auditoria. */
  origin: 'http://localhost:4173',

  /** Rotas auditadas, com o nome usado nos arquivos de relatorio. */
  pages: [
    { name: 'inicio', path: '/' },
    { name: 'detalhe', path: '/nft/emerald-ape-042' },
  ],

  /** Perfis auditados. */
  profiles: ['mobile', 'desktop'],

  /** Medicoes por pagina e perfil — o relatorio publica a mediana. */
  runs: 3,

  /** Categorias avaliadas e metas minimas. */
  thresholds: {
    performance: 90,
    accessibility: 95,
    'best-practices': 95,
    seo: 90,
  },

  /** Diretorio de saida dos relatorios HTML/JSON. */
  outputDir: 'lighthouse-report',
};
