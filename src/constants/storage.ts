/**
 * Chaves do `localStorage` usadas pelo app.
 *
 * Ficam centralizadas porque o logout precisa apagar exatamente estas chaves —
 * e nenhuma outra — para que nada de uma sessao sobreviva para a proxima.
 */

/**
 * Token da sessao.
 * E o unico dado de sessao guardado no cliente; senha nunca sai do servidor.
 */
export const SESSION_TOKEN_STORAGE_KEY = 'kurio:session-token';

/**
 * Identidade do visitante (nao autenticado).
 * Permite ao servidor simulado manter um carrinho por visitante e transferi-lo
 * para a conta no login (enunciado §3).
 */
export const GUEST_ID_STORAGE_KEY = 'kurio:guest-id';

/**
 * Prefixo das tentativas de compra em andamento (uma chave por usuario).
 *
 * A chave de idempotencia e gravada antes de o pedido sair: e o que permite
 * reenviar a MESMA tentativa depois de um timeout ou de um refresh, em vez de
 * criar uma segunda compra. O sufixo e o id do dono, porque a chave de uma
 * conta nao pode ser reaproveitada na sessao de outra.
 */
export const CHECKOUT_ATTEMPT_STORAGE_PREFIX = 'kurio:checkout-attempt:';
