import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  CollectorDisclosureApi,
  CollectorFormApi,
} from '@/features/checkout/types/checkout-state';

/**
 * Abertura da seção "Perfil do colecionador" no frame de 414.
 *
 * No celular o formulário fica recolhido, então uma confirmação barrada pela
 * validação pararia sem nada visível na tela — os erros estariam dentro de uma
 * seção fechada. Este hook faz a ponte: valida, revela a seção e leva o foco ao
 * primeiro campo inválido.
 *
 * O foco vive num efeito, e não no clique, porque só pode acontecer depois de o
 * `details` abrir e os erros entrarem no DOM. O gatilho é um contador de
 * tentativas, e não o estado de abertura: com a seção já aberta, uma segunda
 * tentativa não mudaria nada em que o efeito pudesse reparar.
 *
 * @param validate - Validação do formulário do colecionador.
 * @returns Estado da seção e a validação que a revela quando falha.
 */
export function useCollectorDisclosure(
  validate: CollectorFormApi['validate'],
): CollectorDisclosureApi {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  useEffect(() => {
    if (failedAttempts === 0) return;

    const invalid = panelRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    invalid?.focus();
  }, [failedAttempts]);

  const ensureValid = useCallback(() => {
    if (validate() !== null) return true;

    setIsOpen(true);
    setFailedAttempts((current) => current + 1);
    return false;
  }, [validate]);

  return { isOpen, setIsOpen, panelRef, ensureValid };
}
