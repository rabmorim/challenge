/** Título e descrição de uma rota. */
export interface RouteSeo {
  /** Nome da tela, sem o nome do produto. */
  title: string;
  /** Texto da `<meta name="description">`. */
  description: string;
}

/** Entrada de `<meta>` aceita pelo `<HeadContent />` do TanStack Router. */
export interface RouteMetaTag {
  /** Presente apenas na entrada que define o `<title>`. */
  title?: string;
  /** Nome do `meta`, quando não for o título. */
  name?: string;
  /** Conteúdo do `meta`, quando não for o título. */
  content?: string;
}

/** Retorno da opção `head` de uma rota. */
export interface RouteHead {
  meta: RouteMetaTag[];
}
