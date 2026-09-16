import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { toast } from 'sonner';

import {
  addCartItem,
  removeCartItem,
  updateCartItem,
} from '@/features/cart/api/cart-api';
import { cartQueryOptions } from '@/features/cart/api/cart-queries';
import { CART_FEEDBACK } from '@/features/cart/constants/cart-copy';
import { useCartOwner } from '@/features/cart/hooks/use-cart-owner';
import { withItemQuantity, withoutItem } from '@/features/cart/lib/cart-cache';
import { clampCartQuantity, maxCartQuantity } from '@/features/cart/lib/cart-quantity';
import type { Cart, CartItem } from '@/features/cart/types/cart';
import type {
  AddItemVariables,
  CartMutationContext,
  CartMutationsApi,
  RemoveItemVariables,
  SetQuantityVariables,
} from '@/features/cart/types/cart-state';
import type { Quantity } from '@/types/api';
import type { NormalizedHttpError } from '@/types/http';

/**
 * Mutations do carrinho: incluir, alterar quantidade e remover.
 *
 * **Quantidade e remoção são otimistas com rollback.** A linha reage no mesmo
 * quadro porque o resultado é previsível — o cliente sabe que quantidade pediu
 * — e o `onError` devolve o instantâneo inteiro do carrinho, não um campo
 * solto. O que **não** é otimista é o RESUMO: subtotal, desconto, taxa e total
 * continuam vindo da cotação do servidor, e enquanto a nova não chega o resumo
 * mostra o valor anterior marcado como "atualizando" (ver `useQuoteSummary`).
 *
 * **Inclusão não é otimista** por um motivo diferente: o servidor é quem atribui
 * o id da linha e o preço corrente. Antecipar uma linha inventada seria
 * fabricar dado que só a API tem — e a resposta chega inteira, com o carrinho
 * já recalculado.
 *
 * A quantidade é aparada no teto da edição antes de virar requisição; pedir
 * mais do que a edição comporta não vira erro do servidor, vira aviso.
 *
 * @param announce - Publica o texto na região viva da tela, quando existe.
 * @returns Ações do carrinho e o estado das mutations em voo.
 */
export function useCartMutations(announce?: (message: string) => void): CartMutationsApi {
  const owner = useCartOwner();
  const queryClient = useQueryClient();
  const { queryKey } = cartQueryOptions(owner);

  /**
   * Diz o mesmo texto no toast e na região viva.
   *
   * @param message - Texto do feedback.
   * @param tone - `error` para falhas, `info` para avisos, `success` no resto.
   */
  const report = useCallback(
    (message: string, tone: 'success' | 'info' | 'error' = 'success') => {
      announce?.(message);
      toast[tone](message);
    },
    [announce],
  );

  /**
   * Cancela consultas em voo e guarda o instantâneo antes do otimismo.
   * Sem o cancelamento, uma resposta anterior chegando depois reescreveria o
   * cache por cima do valor otimista.
   *
   * @returns Contexto de rollback.
   */
  const snapshot = useCallback(async (): Promise<CartMutationContext> => {
    await queryClient.cancelQueries({ queryKey });
    return { previous: queryClient.getQueryData<Cart>(queryKey) ?? null };
  }, [queryClient, queryKey]);

  /**
   * Devolve o carrinho ao estado anterior e avisa a falha.
   *
   * @param context - Instantâneo capturado em `onMutate`.
   */
  const rollback = useCallback(
    (context: CartMutationContext | undefined) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      else queryClient.removeQueries({ queryKey });

      report(CART_FEEDBACK.failed, 'error');
    },
    [queryClient, queryKey, report],
  );

  /** Deixa o servidor dar a última palavra depois de qualquer mutation. */
  const settle = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  const addMutation = useMutation({
    mutationFn: ({ nftId, quantity }: AddItemVariables) => addCartItem({ nftId, quantity }),
    onSuccess: (cart, { nftId, quantity }) => {
      queryClient.setQueryData<Cart>(queryKey, cart);
      const name = cart.items.find((item) => item.nftId === nftId)?.name ?? '';
      report(CART_FEEDBACK.added(name, quantity));
    },
    onError: (error: NormalizedHttpError) => {
      report(error.message, 'error');
    },
    onSettled: settle,
  });

  const quantityMutation = useMutation({
    mutationFn: ({ item, quantity }: SetQuantityVariables) => updateCartItem(item.id, quantity),
    onMutate: async ({ item, quantity, silent }) => {
      const context = await snapshot();
      queryClient.setQueryData<Cart>(queryKey, (current) =>
        current ? withItemQuantity(current, item.id, quantity) : current,
      );
      // `silent` existe para o tempo real: quem recebeu o evento sabe o motivo
      // da apara e diz isso, em vez de deixar o genérico sobrescrever a razão.
      if (!silent) announce?.(CART_FEEDBACK.quantityChanged(item.name, quantity));
      return context;
    },
    onSuccess: (cart) => {
      queryClient.setQueryData<Cart>(queryKey, cart);
    },
    onError: (_error, _variables, context) => {
      rollback(context);
    },
    onSettled: settle,
  });

  const removeMutation = useMutation({
    mutationFn: ({ item }: RemoveItemVariables) => removeCartItem(item.id),
    onMutate: async ({ item }) => {
      const context = await snapshot();
      queryClient.setQueryData<Cart>(queryKey, (current) =>
        current ? withoutItem(current, item.id) : current,
      );
      report(CART_FEEDBACK.removed(item.name));
      return context;
    },
    onSuccess: (cart) => {
      queryClient.setQueryData<Cart>(queryKey, cart);
    },
    onError: (_error, _variables, context) => {
      rollback(context);
    },
    onSettled: settle,
  });

  // As dependências são os `mutate`, e não os objetos de mutation: em v5 o
  // objeto é recriado a cada render, e depender dele faria estas funções
  // trocarem de identidade sempre — o listener de `nft.updated`, que recebe
  // `setQuantity`, se desligaria e religaria a cada quadro.
  const { mutate: mutateAdd } = addMutation;
  const { mutate: mutateQuantity } = quantityMutation;
  const { mutate: mutateRemove } = removeMutation;

  const addItem = useCallback(
    (nftId: string, quantity: Quantity) => {
      mutateAdd({ nftId, quantity });
    },
    [mutateAdd],
  );

  const setQuantity = useCallback(
    (item: CartItem, quantity: Quantity, options?: { silent?: boolean }) => {
      const next = clampCartQuantity(quantity, item.edition);

      if (quantity > next && !options?.silent) {
        // O "+" que para de responder sem explicação é o que confunde: o teto
        // vem da disponibilidade da edição, que pode ter mudado agora mesmo.
        report(CART_FEEDBACK.quantityClamped(item.name, maxCartQuantity(item.edition)), 'info');
      }

      if (next === item.quantity) return;
      mutateQuantity({ item, quantity: next, silent: options?.silent ?? false });
    },
    [mutateQuantity, report],
  );

  const removeItem = useCallback(
    (item: CartItem) => {
      mutateRemove({ item });
    },
    [mutateRemove],
  );

  return {
    addItem,
    setQuantity,
    removeItem,
    pendingItemId:
      (quantityMutation.isPending ? quantityMutation.variables.item.id : null) ??
      (removeMutation.isPending ? removeMutation.variables.item.id : null),
    isAdding: addMutation.isPending,
  };
}
