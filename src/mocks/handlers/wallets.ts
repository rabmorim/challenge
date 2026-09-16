import { HttpResponse, http, type HttpHandler } from 'msw';

import { API_PATTERNS } from '@/constants/api';
import { isNetworkId } from '@/constants/network';
import type {
  CreateWalletRequest,
  UpdateWalletRequest,
  Wallet,
  WalletsResponse,
} from '@/features/wallets/types/wallet';
import { commitDatabase } from '@/mocks/db/store';
import { apiUrl, isActiveSession, readJsonBody, requireSession } from '@/mocks/handlers/shared';
import { conflict, notFound, validationError } from '@/mocks/lib/responses';
import { createWalletId } from '@/mocks/lib/ids';
import { getActiveScenario } from '@/mocks/scenarios/active';
import { applyNetworkBehavior } from '@/mocks/scenarios/network';
import type { MockDatabase, WalletRecord } from '@/mocks/types/db';

/**
 * Carteiras do colecionador: consulta, cadastro e atualizacao.
 *
 * Regra da simulacao: so uma carteira pode ser a principal — promover outra
 * rebaixa a anterior para secundaria (o layout preve exatamente esses dois
 * papeis). O `status` permite simular conexao, recusa e desconexao sem
 * extensao de carteira real: o cenario `wallet-refused` nega a conexao como a
 * extensao faria, e a carteira termina em `refused` — nao ha sucesso falso.
 */

/** Formato de endereco aceito (padrao Ethereum, usado tambem pelas outras redes). */
const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;

/** Provedores aceitos. */
const PROVIDERS = new Set<string>(['metamask', 'walletconnect', 'coinbase']);

/** Formato aceito para o nome ENS (`rotulo.tld`, minusculo). */
const ENS_PATTERN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;

/** Formato de e-mail aceito. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Tamanho minimo dos nomes do formulario. */
const MIN_NAME_LENGTH = 3;

/** Tamanho minimo do codigo de indicacao. */
const MIN_REFERRAL_LENGTH = 4;

/**
 * Remove o `userId` antes de publicar a carteira.
 *
 * @param record - Carteira persistida.
 * @returns Carteira no formato do contrato.
 */
function toWallet(record: WalletRecord): Wallet {
  const { userId: _userId, ...wallet } = record;
  return wallet;
}

/**
 * Garante que apenas uma carteira do usuario seja a principal.
 *
 * @param db - Estado do servidor simulado.
 * @param userId - Dono das carteiras.
 * @param promotedId - Carteira que passa a ser principal.
 */
function demoteOtherPrimaries(db: MockDatabase, userId: string, promotedId: string): void {
  for (const wallet of db.wallets) {
    if (wallet.userId !== userId || wallet.id === promotedId) continue;
    if (wallet.role === 'primary') {
      wallet.role = 'secondary';
      wallet.updatedAt = new Date().toISOString();
    }
  }
}

/**
 * Valida os campos comuns de cadastro e atualizacao.
 *
 * @param body - Corpo recebido (parcial na atualizacao).
 * @param requireAll - `true` no cadastro, quando todos os campos sao obrigatorios.
 * @returns Erros por campo.
 */
function validateWallet(
  body: Partial<CreateWalletRequest>,
  requireAll: boolean,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (requireAll || body.label !== undefined) {
    if (!body.label || body.label.trim().length < MIN_NAME_LENGTH) {
      errors.label = `Use ao menos ${String(MIN_NAME_LENGTH)} caracteres no apelido.`;
    }
  }

  if (requireAll || body.displayName !== undefined) {
    if (!body.displayName || body.displayName.trim().length < MIN_NAME_LENGTH) {
      errors.displayName = `Use ao menos ${String(MIN_NAME_LENGTH)} caracteres no nome de exibicao.`;
    }
  }

  if (requireAll || body.profileName !== undefined) {
    if (!body.profileName || body.profileName.trim().length < MIN_NAME_LENGTH) {
      errors.profileName = `Use ao menos ${String(MIN_NAME_LENGTH)} caracteres no nome do perfil.`;
    }
  }

  if (requireAll || body.email !== undefined) {
    if (!body.email || !EMAIL_PATTERN.test(body.email.trim())) {
      errors.email = 'Informe um e-mail valido.';
    }
  }

  if (requireAll || body.referralCode !== undefined) {
    if (!body.referralCode || body.referralCode.trim().length < MIN_REFERRAL_LENGTH) {
      errors.referralCode = `Informe o codigo de indicacao (ao menos ${String(MIN_REFERRAL_LENGTH)} caracteres).`;
    }
  }

  const linked = body.linkedReference?.trim() ?? '';
  if (linked.length > 0 && !ADDRESS_PATTERN.test(linked) && !ENS_PATTERN.test(linked.toLowerCase())) {
    errors.linkedReference = 'Informe um endereco 0x ou um nome ENS (ex.: nova.kurio.eth).';
  }

  if (requireAll || body.address !== undefined) {
    if (!body.address || !ADDRESS_PATTERN.test(body.address.trim())) {
      errors.address = 'Endereco invalido: use o formato 0x + 40 caracteres hexadecimais.';
    }
  }

  if (requireAll || body.provider !== undefined) {
    if (!body.provider || !PROVIDERS.has(body.provider)) {
      errors.provider = 'Escolha um provedor de carteira.';
    }
  }

  if (requireAll || body.network !== undefined) {
    if (!isNetworkId(body.network)) errors.network = 'Escolha uma rede valida.';
  }

  if (requireAll || body.role !== undefined) {
    if (body.role !== 'primary' && body.role !== 'secondary') {
      errors.role = 'Escolha entre carteira principal e secundaria.';
    }
  }

  if (body.ensName !== undefined && body.ensName !== null && body.ensName.trim().length > 0) {
    if (!ENS_PATTERN.test(body.ensName.trim().toLowerCase())) {
      errors.ensName = 'Nome ENS invalido: use o formato nome.eth.';
    }
  }

  return errors;
}

/** Handlers de carteiras. */
export const walletHandlers: HttpHandler[] = [
  http.get(apiUrl(API_PATTERNS.wallets), async ({ request }) => {
    const failure = await applyNetworkBehavior();
    if (failure) return failure;

    const result = requireSession(request);
    if (!isActiveSession(result)) return result.response;

    const items = result.db.wallets
      .filter((wallet) => wallet.userId === result.user.id)
      .map(toWallet);

    return HttpResponse.json<WalletsResponse>({ items });
  }),

  http.post(apiUrl(API_PATTERNS.wallets), async ({ request }) => {
    const failure = await applyNetworkBehavior();
    if (failure) return failure;

    const result = requireSession(request);
    if (!isActiveSession(result)) return result.response;

    const body = await readJsonBody<CreateWalletRequest>(request);
    if (!body) return validationError({ form: 'Corpo da requisicao invalido.' });

    const errors = validateWallet(body, true);
    if (Object.keys(errors).length > 0) return validationError(errors);

    const { db, user } = result;
    const address = body.address.trim();

    if (db.wallets.some((wallet) => wallet.userId === user.id && wallet.address === address)) {
      return conflict('WALLET_ADDRESS_ALREADY_REGISTERED', 'Esta carteira ja esta cadastrada.');
    }

    const timestamp = new Date().toISOString();
    const wallet: WalletRecord = {
      id: createWalletId(),
      userId: user.id,
      label: body.label.trim(),
      provider: body.provider,
      role: body.role,
      address,
      ensName: body.ensName?.trim().toLowerCase() || null,
      network: body.network,
      displayName: body.displayName.trim(),
      profileName: body.profileName.trim(),
      email: body.email.trim().toLowerCase(),
      referralCode: body.referralCode.trim(),
      linkedReference: body.linkedReference?.trim() || null,
      status: 'connected',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    db.wallets.push(wallet);
    if (wallet.role === 'primary') demoteOtherPrimaries(db, user.id, wallet.id);
    commitDatabase();

    return HttpResponse.json<Wallet>(toWallet(wallet), { status: 201 });
  }),

  http.patch(apiUrl(API_PATTERNS.walletById), async ({ request, params }) => {
    const failure = await applyNetworkBehavior();
    if (failure) return failure;

    const result = requireSession(request);
    if (!isActiveSession(result)) return result.response;

    const body = await readJsonBody<UpdateWalletRequest>(request);
    if (!body) return validationError({ form: 'Corpo da requisicao invalido.' });

    const errors = validateWallet(body, false);
    if (Object.keys(errors).length > 0) return validationError(errors);

    const { db, user } = result;
    const wallet = db.wallets.find(
      (candidate) => candidate.id === String(params.walletId) && candidate.userId === user.id,
    );

    if (!wallet) return notFound('Carteira nao encontrada.');

    if (body.address) {
      const address = body.address.trim();
      const taken = db.wallets.some(
        (candidate) =>
          candidate.userId === user.id && candidate.id !== wallet.id && candidate.address === address,
      );
      if (taken) return conflict('WALLET_ADDRESS_ALREADY_REGISTERED', 'Esta carteira ja esta cadastrada.');
      wallet.address = address;
    }

    if (body.label !== undefined) wallet.label = body.label.trim();
    if (body.provider) wallet.provider = body.provider;
    if (body.network) wallet.network = body.network;
    if (body.displayName !== undefined) wallet.displayName = body.displayName.trim();
    if (body.profileName !== undefined) wallet.profileName = body.profileName.trim();
    if (body.email !== undefined) wallet.email = body.email.trim().toLowerCase();
    if (body.referralCode !== undefined) wallet.referralCode = body.referralCode.trim();
    if (body.linkedReference !== undefined) {
      wallet.linkedReference = body.linkedReference?.trim() || null;
    }
    if (body.ensName !== undefined) {
      wallet.ensName = body.ensName?.trim().toLowerCase() || null;
    }

    if (body.status === 'connected' && getActiveScenario().wallet.refuseConnection) {
      // A recusa e real: a carteira fica `refused` no store, entao a interface
      // mostra o estado verdadeiro e o pedido com ela cai em WALLET_UNAVAILABLE.
      wallet.status = 'refused';
      wallet.updatedAt = new Date().toISOString();
      commitDatabase();

      return conflict(
        'WALLET_UNAVAILABLE',
        'A conexao foi recusada na carteira. Tente novamente ou escolha outra.',
      );
    }

    if (body.status) wallet.status = body.status;

    if (body.role) {
      wallet.role = body.role;
      if (body.role === 'primary') demoteOtherPrimaries(db, user.id, wallet.id);
    }

    wallet.updatedAt = new Date().toISOString();
    commitDatabase();

    return HttpResponse.json<Wallet>(toWallet(wallet));
  }),
];
