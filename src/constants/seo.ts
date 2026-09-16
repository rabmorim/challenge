/**
 * Nome do produto, sufixo de todo título de página.
 * Sai do `index.html`, que é quem serve o título antes do JavaScript subir.
 */
export const SITE_NAME = 'KURIO';

/** Separador entre o nome da tela e o nome do produto. */
const TITLE_SEPARATOR = ' — ';

/**
 * Monta o `<title>` de uma rota.
 *
 * @param pageTitle - Nome da tela; vazio devolve só o nome do produto.
 * @returns Título completo, com o produto ao final.
 */
export function buildPageTitle(pageTitle: string): string {
  return pageTitle.length > 0 ? `${pageTitle}${TITLE_SEPARATOR}${SITE_NAME}` : SITE_NAME;
}

/**
 * Título e descrição de cada rota.
 *
 * A aplicação é renderizada no cliente, então estes valores entram no documento
 * quando o router resolve a rota — o `index.html` continua servindo o par da
 * Início, que é o que um rastreador sem JavaScript enxerga.
 *
 * O detalhe do NFT tem título genérico de propósito: o `loader` da rota apenas
 * aquece o cache, sem bloquear a navegação, então o nome da peça não existe no
 * momento em que o `head` é montado. Ver ARCHITECTURE §11.
 */
export const ROUTE_SEO = {
  home: {
    title: 'Marketplace de NFTs',
    description:
      'Descubra, favorite e compre NFTs de criadores emergentes e consagrados, com carteiras e redes simuladas.',
  },
  marketplace: {
    title: 'Mercado',
    description:
      'Catálogo completo de NFTs do KURIO, com busca, filtros combináveis, ordenação e paginação.',
  },
  nftDetail: {
    title: 'Detalhe do NFT',
    description:
      'Ficha da peça: arte, edição, atributos, avaliações de colecionadores e compra com carteira simulada.',
  },
  cart: {
    title: 'Carrinho',
    description: 'Revise os NFTs escolhidos, ajuste quantidades e aplique cupons antes de finalizar.',
  },
  checkout: {
    title: 'Pagamento',
    description: 'Confirme os dados do colecionador e finalize a compra com uma carteira conectada.',
  },
  profile: {
    title: 'Meu perfil',
    description: 'Dados do colecionador, avatar e troca de senha.',
  },
  wallets: {
    title: 'Carteiras',
    description: 'Carteira principal e secundária usadas no pagamento.',
  },
  favorites: {
    title: 'Meus favoritos',
    description: 'NFTs que você guardou para acompanhar.',
  },
  notFound: {
    title: 'Página não encontrada',
    description: 'O endereço acessado não corresponde a nenhuma tela do KURIO.',
  },
} as const;
