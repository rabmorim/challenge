import type { EthAmount } from '@/types/api';
import type { NetworkId } from '@/types/network';

/**
 * Constantes da camada de mocks.
 * Ficam separadas das constantes do app porque descrevem o servidor simulado
 * (regras de negocio da simulacao), nao o dominio da interface.
 */

/** Cenario aplicado quando nenhum outro e selecionado. */
export const DEFAULT_SCENARIO = 'default' as const;

/** Chave usada para persistir o estado simulado entre refreshes. */
export const MOCK_STATE_STORAGE_KEY = 'kurio:mock-state' as const;

/**
 * Versao do FORMATO persistido. Incrementar invalida o estado salvo no
 * navegador e forca uma nova semeadura — evita quebrar num refresh depois de
 * mudar a forma dos dados.
 *
 * Mudanca no CONTEUDO das fixtures nao precisa passar por aqui: o envelope
 * carrega a assinatura da semeadura (`getSeedSignature`), que invalida sozinha.
 */
export const MOCK_STATE_SCHEMA_VERSION = 5;

/** Parametro de URL que seleciona o cenario, ex.: `?scenario=offline`. */
export const SCENARIO_URL_PARAM = 'scenario' as const;

/** Prefixo dos endpoints de controle da simulacao (nao fazem parte da API). */
export const MOCK_CONTROL_PREFIX = '/__mocks' as const;

/** Endpoints de controle usados por testes e pela demonstracao. */
export const MOCK_CONTROL_PATHS = {
  /** `GET` le o cenario ativo; `POST` troca de cenario (e ressemeia). */
  scenario: `${MOCK_CONTROL_PREFIX}/scenario`,
  /** `POST` restaura integralmente o cenario conhecido. */
  reset: `${MOCK_CONTROL_PREFIX}/reset`,
  /** `POST` dispara `nft.updated` com os valores informados. */
  emitNft: `${MOCK_CONTROL_PREFIX}/events/nft`,
  /** `POST` dispara `order.updated` com o estado informado. */
  emitOrder: `${MOCK_CONTROL_PREFIX}/events/order`,
  /** `POST` expira a sessao corrente sem esperar o TTL. */
  expireSession: `${MOCK_CONTROL_PREFIX}/session/expire`,
} as const;

/** Duracao padrao de uma sessao simulada. */
export const SESSION_TTL_MS = 30 * 60_000;

/** Validade de uma cotacao; depois disso o pedido exige nova cotacao. */
export const QUOTE_TTL_MS = 10 * 60_000;

/**
 * Taxa de rede por rede: uma parte fixa mais uma parte por item.
 * O servidor simulado e a referencia — o cliente nunca recalcula.
 */
export const NETWORK_FEES: Record<NetworkId, { base: EthAmount; perItem: EthAmount }> = {
  ethereum: { base: '0.0042', perItem: '0.0009' },
  polygon: { base: '0.0011', perItem: '0.0003' },
  solana: { base: '0.0006', perItem: '0.0002' },
};

/** Quantidade de itens que a aba "Novos lancamentos" mostra (mais recentes). */
export const NEW_RELEASES_LIMIT = 8;

/** Quantidade de itens que a aba "Em alta" mostra (maior `trendingScore`). */
export const TRENDING_LIMIT = 8;

/** Autores das avaliações semeadas — nomes fictícios, reusados entre os itens. */
export const REVIEW_AUTHORS = [
  'Ana Sato',
  'Bruno Lima',
  'Carla Nakamura',
  'Diego Prado',
  'Elisa Moraes',
  'Fabio Rocha',
] as const;

/** Comentários semeados das avaliações. */
export const REVIEW_COMMENTS = [
  'Arte impecável e procedência fácil de conferir na rede.',
  'Chegou rápido à carteira e o contrato bate com o anunciado.',
  'Edição pequena, acabamento caprichado. Valeu o preço.',
  'Bom acervo para quem acompanha a coleção desde o começo.',
  'Metadados completos e imagem em alta resolução de verdade.',
  'Recomendo para quem quer começar uma coleção com segurança.',
] as const;

/**
 * Data base das avaliações semeadas.
 * Fixa de propósito: a tela de detalhe entra na regressão visual, e uma data
 * derivada de `Date.now()` mudaria a baseline a cada execução.
 */
export const REVIEW_EPOCH = Date.parse('2026-02-24T12:00:00.000Z');

/** Tamanho minimo de senha aceito no cadastro e na troca de senha. */
export const MIN_PASSWORD_LENGTH = 8;

/** Tamanho minimo do nome de usuario. */
export const MIN_USERNAME_LENGTH = 3;

/** Avatar de uma conta recem-criada, antes de o colecionador enviar o dele. */
export const DEFAULT_AVATAR_URL = '/avatars/collector-placeholder.png';

/**
 * Valor que representa "sem avatar".
 * String vazia (e nao a imagem padrao) porque o frame do perfil oferece
 * "Remover": depois dele a interface mostra a inicial do usuario, e nao um
 * retrato generico que pareceria uma escolha.
 */
export const EMPTY_AVATAR_URL = '';

/** Apelido de carteira sugerido a uma conta nova. */
export const DEFAULT_WALLET_LABEL = 'Carteira principal';

/** Prefixo da referencia legivel de pedido, ex.: `KUR-000123`. */
export const ORDER_REFERENCE_PREFIX = 'KUR' as const;

/** Base do link simulado de exploracao de transacao. */
export const EXPLORER_BASE_URL = 'https://explorer.kurio.mock/tx' as const;

/**
 * Prefixo `ws:`/`wss:` correspondente ao protocolo da pagina.
 * O engine.io troca `http(s)` por `ws(s)` ao abrir o transporte, e o link do
 * MSW precisa casar exatamente com essa URL.
 */
export const WS_PROTOCOL_BY_PAGE_PROTOCOL = {
  'https:': 'wss:',
  'http:': 'ws:',
} as const;
