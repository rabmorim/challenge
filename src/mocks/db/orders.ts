import type {
  CollectorDetails,
  CreateOrderRequest,
  Order,
  OrderDeclineReason,
  OrderItem,
  OrderStatus,
} from '@/features/checkout/types/order';
import { TERMINAL_ORDER_STATUSES } from '@/features/checkout/constants/checkout';
import { EXPLORER_BASE_URL } from '@/mocks/constants';
import { removePurchasedItems } from '@/mocks/db/cart';
import { releaseEditionUnits, reserveEditionUnits } from '@/mocks/db/nfts';
import { findQuote, toAvailabilityConflict } from '@/mocks/db/pricing';
import { commitDatabase } from '@/mocks/db/store';
import { fingerprint } from '@/mocks/lib/hash';
import { createOrderIdentity, createTransactionHash } from '@/mocks/lib/ids';
import { emitOrderUpdated } from '@/mocks/socket/emitter';
import type { MockDatabase, QuoteRecord, ReceiptRecord, UserRecord } from '@/mocks/types/db';
import type { OrderCreationResult, OrderFailure } from '@/mocks/types/orders';
import type { AvailabilityConflict } from '@/types/api';

/**
 * Pedidos do servidor simulado.
 *
 * Tres regras sustentam esta camada:
 * 1. **Idempotencia** — a mesma chave com o mesmo corpo devolve o mesmo pedido;
 *    a mesma chave com corpo diferente e conflito. E o que impede pedido
 *    duplicado em clique repetido ou reenvio depois de timeout.
 * 2. **Revalidacao** — a cotacao e reconferida contra o catalogo atual antes de
 *    aceitar. Preco ou disponibilidade diferentes viram conflito, nunca compra.
 * 3. **Estados terminais** — `confirmed` e `declined` nao mudam mais, nem por
 *    evento repetido nem por refetch.
 */

/** Mensagem de erro de cada campo obrigatorio do colecionador. */
const COLLECTOR_FIELD_LABELS = {
  displayName: 'Informe o nome de exibicao (ao menos 3 caracteres).',
  username: 'Informe o nome de usuario (ao menos 3 caracteres).',
  profileName: 'Informe o nome do perfil (ao menos 3 caracteres).',
  email: 'Informe um e-mail valido.',
  walletAddress: 'Endereco invalido: use o formato 0x + 40 caracteres hexadecimais.',
  secondaryWallet: 'Informe um endereco 0x ou um nome ENS (ex.: nova.kurio.eth).',
  referralCode: 'Informe o codigo de indicacao (ao menos 4 caracteres).',
  ensDomain: 'Escolha um dominio ENS.',
  note: 'A observacao pode ter no maximo 280 caracteres.',
} as const satisfies Partial<Record<keyof CollectorDetails, string>>;

/** Tamanho minimo dos nomes do formulario. */
const MIN_NAME_LENGTH = 3;

/** Tamanho minimo do codigo de indicacao. */
const MIN_REFERRAL_LENGTH = 4;

/** Tamanho maximo da observacao do colecionador. */
const MAX_NOTE_LENGTH = 280;

/** Formato de endereco aceito (padrao Ethereum, usado tambem nas outras redes). */
const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;

/** Formato de e-mail aceito. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Formato de nome ENS aceito (`rotulo.tld`). */
const ENS_PATTERN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i;

/** Formato do dominio ENS escolhido no seletor (`.eth`, `.kurio.eth`...). */
const ENS_DOMAIN_PATTERN = /^\.[a-z0-9-]+(\.[a-z0-9-]+)*$/i;

/**
 * Valida os dados do colecionador.
 *
 * Os campos sao os do frame de pagamento; os opcionais ("ENS ou carteira
 * secundaria" e a observacao) so sao conferidos quando vem preenchidos.
 *
 * @param collector - Dados enviados no pedido.
 * @returns Erros por campo (vazio quando tudo esta valido).
 */
function validateCollector(collector: CollectorDetails): Record<string, string> {
  const errors: Record<string, string> = {};

  if (collector.displayName.trim().length < MIN_NAME_LENGTH) {
    errors.displayName = COLLECTOR_FIELD_LABELS.displayName;
  }
  if (collector.username.trim().length < MIN_NAME_LENGTH) {
    errors.username = COLLECTOR_FIELD_LABELS.username;
  }
  if (collector.profileName.trim().length < MIN_NAME_LENGTH) {
    errors.profileName = COLLECTOR_FIELD_LABELS.profileName;
  }
  if (!EMAIL_PATTERN.test(collector.email)) errors.email = COLLECTOR_FIELD_LABELS.email;
  if (!ADDRESS_PATTERN.test(collector.walletAddress.trim())) {
    errors.walletAddress = COLLECTOR_FIELD_LABELS.walletAddress;
  }
  if (collector.referralCode.trim().length < MIN_REFERRAL_LENGTH) {
    errors.referralCode = COLLECTOR_FIELD_LABELS.referralCode;
  }
  if (!ENS_DOMAIN_PATTERN.test(collector.ensDomain)) {
    errors.ensDomain = COLLECTOR_FIELD_LABELS.ensDomain;
  }

  const secondary = collector.secondaryWallet?.trim();
  if (secondary && !ADDRESS_PATTERN.test(secondary) && !ENS_PATTERN.test(secondary)) {
    errors.secondaryWallet = COLLECTOR_FIELD_LABELS.secondaryWallet;
  }

  if ((collector.note?.length ?? 0) > MAX_NOTE_LENGTH) {
    errors.note = COLLECTOR_FIELD_LABELS.note;
  }

  return errors;
}

/**
 * Confere se os itens enviados sao exatamente os da cotacao.
 *
 * @param quote - Cotacao registrada.
 * @param request - Corpo do pedido.
 * @returns `true` quando itens e quantidades coincidem.
 */
function matchesQuoteItems(quote: QuoteRecord, request: CreateOrderRequest): boolean {
  if (quote.lines.length !== request.items.length) return false;

  return request.items.every((item) =>
    quote.lines.some((line) => line.nftId === item.nftId && line.quantity === item.quantity),
  );
}

/**
 * Revalida a cotacao contra o catalogo atual.
 *
 * @param db - Estado do servidor simulado.
 * @param quote - Cotacao registrada.
 * @returns Falha com os conflitos encontrados, ou `null` quando tudo confere.
 */
function revalidateQuote(db: MockDatabase, quote: QuoteRecord): OrderFailure | null {
  const priceConflicts: AvailabilityConflict[] = [];
  const availabilityConflicts: AvailabilityConflict[] = [];

  for (const line of quote.lines) {
    const nft = db.nfts.find((candidate) => candidate.id === line.nftId);

    if (!nft) {
      return {
        reason: 'QUOTE_STALE',
        message: 'Um dos itens saiu do catalogo. Refaca a cotacao.',
      };
    }

    // Compara o PRECO, nao a versao: alteracao de disponibilidade tambem sobe a
    // versao do recurso, e uma edicao que continua no mesmo preco e com estoque
    // suficiente nao e motivo para recusar a compra.
    if (nft.price !== line.unitPrice) {
      priceConflicts.push(toAvailabilityConflict(nft, line.quantity, line.unitPrice));
      continue;
    }

    if (line.quantity > nft.edition.available) {
      availabilityConflicts.push(toAvailabilityConflict(nft, line.quantity, line.unitPrice));
    }
  }

  if (priceConflicts.length > 0) {
    return {
      reason: 'PRICE_CHANGED',
      message: 'O preco de um item mudou desde a cotacao. Confirme os novos valores.',
      conflicts: priceConflicts,
    };
  }

  if (availabilityConflicts.length > 0) {
    return {
      reason: 'EDITION_SOLD_OUT',
      message: 'A edicao de um item esgotou antes da confirmacao.',
      conflicts: availabilityConflicts,
    };
  }

  return null;
}

/**
 * Monta os itens do pedido a partir da cotacao (snapshot imutavel).
 *
 * @param db - Estado do servidor simulado.
 * @param quote - Cotacao aprovada.
 * @returns Itens congelados no pedido.
 */
function toOrderItems(db: MockDatabase, quote: QuoteRecord): OrderItem[] {
  return quote.lines.flatMap((line) => {
    const nft = db.nfts.find((candidate) => candidate.id === line.nftId);
    if (!nft) return [];

    return [
      {
        nftId: line.nftId,
        slug: nft.slug,
        name: line.name,
        tokenId: nft.tokenId,
        imageUrl: line.imageUrl,
        imageAlt: nft.imageAlt,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        lineTotal: line.lineTotal,
      },
    ];
  });
}

/**
 * Cria um pedido de forma idempotente.
 *
 * @param db - Estado do servidor simulado.
 * @param user - Usuario autenticado (pedido exige sessao).
 * @param request - Corpo do pedido, com a cotacao a revalidar.
 * @param idempotencyKey - Chave enviada no cabecalho `x-idempotency-key`.
 * @returns Pedido criado, pedido recuperado pela chave, ou a falha correspondente.
 */
export function createOrder(
  db: MockDatabase,
  user: UserRecord,
  request: CreateOrderRequest,
  idempotencyKey: string | null,
): OrderCreationResult {
  if (!idempotencyKey) {
    return {
      ok: false,
      failure: {
        message: 'A criacao de pedido exige uma chave de idempotencia.',
        fieldErrors: { idempotencyKey: 'Cabecalho x-idempotency-key ausente.' },
      },
    };
  }

  const requestFingerprint = fingerprint(request);
  const existing = db.idempotency.find(
    (record) => record.key === idempotencyKey && record.ownerId === user.id,
  );

  if (existing) {
    if (existing.fingerprint !== requestFingerprint) {
      return {
        ok: false,
        failure: {
          reason: 'IDEMPOTENCY_KEY_REUSED',
          message: 'Esta chave de idempotencia ja foi usada com outro conteudo.',
        },
      };
    }

    const order = db.orders.find((candidate) => candidate.id === existing.orderId);
    if (order) return { ok: true, order, replayed: true };
  }

  const fieldErrors = validateCollector(request.collector);
  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      failure: { message: 'Revise os dados do colecionador.', fieldErrors },
    };
  }

  const wallet = db.wallets.find(
    (candidate) => candidate.id === request.walletId && candidate.userId === user.id,
  );

  if (!wallet) {
    return {
      ok: false,
      failure: {
        message: 'Selecione uma carteira cadastrada.',
        fieldErrors: { walletId: 'Carteira nao encontrada.' },
      },
    };
  }

  if (wallet.status === 'refused') {
    return {
      ok: false,
      failure: {
        reason: 'WALLET_UNAVAILABLE',
        message: 'A carteira recusou a conexao. Conecte novamente para continuar.',
      },
    };
  }

  const quote = findQuote(db, user.id, request.quoteId);
  if (!quote) {
    return {
      ok: false,
      failure: { reason: 'QUOTE_STALE', message: 'Cotacao nao encontrada. Refaca a cotacao.' },
    };
  }

  if (Date.parse(quote.expiresAt) <= Date.now()) {
    return {
      ok: false,
      failure: { reason: 'QUOTE_EXPIRED', message: 'A cotacao expirou. Refaca a cotacao.' },
    };
  }

  if (
    quote.pricingSignature !== request.pricingSignature ||
    !matchesQuoteItems(quote, request) ||
    (quote.coupon?.code ?? null) !== request.couponCode ||
    quote.network !== request.network
  ) {
    return {
      ok: false,
      failure: {
        reason: 'QUOTE_STALE',
        message: 'Os dados enviados nao correspondem a cotacao. Refaca a cotacao.',
      },
    };
  }

  const staleQuote = revalidateQuote(db, quote);
  if (staleQuote) return { ok: false, failure: staleQuote };

  const { id, reference } = createOrderIdentity();
  const createdAt = new Date().toISOString();

  const order: Order = {
    id,
    version: 1,
    reference,
    status: 'pending',
    userId: user.id,
    items: toOrderItems(db, quote),
    totals: {
      subtotal: quote.subtotal,
      discount: quote.discount,
      networkFee: quote.networkFee,
      total: quote.total,
    },
    coupon: quote.coupon,
    network: quote.network,
    walletId: wallet.id,
    walletAddress: wallet.address,
    collector: { ...request.collector },
    transactionHash: null,
    explorerUrl: null,
    declineReason: null,
    createdAt,
    updatedAt: createdAt,
  };

  db.orders.push(order);
  db.idempotency.push({
    key: idempotencyKey,
    ownerId: user.id,
    fingerprint: requestFingerprint,
    orderId: order.id,
    createdAt,
  });

  // Reservar as unidades aqui (e nao na confirmacao) e o que faz duas compras
  // simultaneas do mesmo item ultimo esgotarem de verdade. A recusa devolve.
  for (const line of quote.lines) {
    const nft = db.nfts.find((candidate) => candidate.id === line.nftId);
    if (nft) reserveEditionUnits(nft, line.quantity);
  }

  commitDatabase();
  return { ok: true, order, replayed: false };
}

/**
 * Muda o estado de um pedido, emitindo `order.updated`.
 *
 * Estados terminais nao mudam: chamar de novo (evento duplicado, reenvio de
 * controle) e um no-op. A confirmacao gera o hash simulado e remove do carrinho
 * apenas os itens e quantidades comprados; a recusa devolve as unidades a edicao.
 *
 * @param db - Estado do servidor simulado.
 * @param order - Pedido a atualizar.
 * @param status - Novo estado.
 * @param options - Motivo da recusa e cenario vigente (registrado no recibo).
 * @returns Pedido atualizado, ou `null` quando ja estava em estado terminal.
 */
export function transitionOrder(
  db: MockDatabase,
  order: Order,
  status: OrderStatus,
  options: { declineReason?: OrderDeclineReason; scenario: string },
): Order | null {
  if (TERMINAL_ORDER_STATUSES.includes(order.status)) return null;

  order.status = status;
  order.version += 1;
  order.updatedAt = new Date().toISOString();

  if (status === 'confirmed') {
    order.transactionHash = createTransactionHash(order.id);
    order.explorerUrl = `${EXPLORER_BASE_URL}/${order.transactionHash}`;
    order.declineReason = null;
    removePurchasedItems(
      db,
      order.userId,
      order.items.map((item) => ({ nftId: item.nftId, quantity: item.quantity })),
    );
  }

  if (status === 'declined') {
    order.declineReason = options.declineReason ?? 'PAYMENT_DECLINED';
    order.transactionHash = null;
    order.explorerUrl = null;

    for (const item of order.items) {
      const nft = db.nfts.find((candidate) => candidate.id === item.nftId);
      if (nft) releaseEditionUnits(nft, item.quantity);
    }
  }

  if (TERMINAL_ORDER_STATUSES.includes(status)) {
    const receipt: ReceiptRecord = {
      orderId: order.id,
      order: structuredClone(order),
      issuedAt: order.updatedAt,
      scenario: options.scenario,
    };

    db.receipts = db.receipts.filter((candidate) => candidate.orderId !== order.id);
    db.receipts.push(receipt);
  }

  commitDatabase();
  emitOrderUpdated(order);

  return order;
}

/**
 * Encontra um pedido do usuario.
 * Pedido de outro usuario nao e encontrado — o handler responde 404, sem
 * revelar que o recurso existe.
 *
 * @param db - Estado do servidor simulado.
 * @param userId - Dono do pedido.
 * @param orderId - Id do pedido.
 * @returns Pedido ou `undefined`.
 */
export function findOrder(db: MockDatabase, userId: string, orderId: string): Order | undefined {
  return db.orders.find((order) => order.id === orderId && order.userId === userId);
}

/**
 * Lista os pedidos do usuario, do mais recente para o mais antigo.
 *
 * @param db - Estado do servidor simulado.
 * @param userId - Dono dos pedidos.
 * @returns Pedidos do usuario.
 */
export function listOrders(db: MockDatabase, userId: string): Order[] {
  return db.orders
    .filter((order) => order.userId === userId)
    .toSorted((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}

/**
 * Encontra o recibo de um pedido do usuario.
 * Existe apenas para pedidos em estado terminal — pendente nao tem recibo.
 *
 * @param db - Estado do servidor simulado.
 * @param userId - Dono do pedido.
 * @param orderId - Id do pedido.
 * @returns Recibo ou `undefined`.
 */
export function findReceipt(
  db: MockDatabase,
  userId: string,
  orderId: string,
): ReceiptRecord | undefined {
  const order = findOrder(db, userId, orderId);
  if (!order) return undefined;
  return db.receipts.find((receipt) => receipt.orderId === orderId);
}
