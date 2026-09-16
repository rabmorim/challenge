import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { RECEIPT_COPY } from '@/features/checkout/constants/checkout-copy';

/**
 * "Ver no Etherscan" — um no-op coerente.
 *
 * A transação é simulada: navegar para um explorador real mostraria "não
 * encontrado", e abrir um link falso seria aparentar sucesso funcional, que é
 * exatamente o que o enunciado proíbe para ações fora do escopo. O botão
 * explica isso no lugar de fingir.
 *
 * Fica em componente próprio para que o aviso seja **estado local com ciclo de
 * vida próprio**: quem monta o recibo passa `key` com o id do pedido, então
 * abrir o recibo de outra compra começa com o aviso fechado sem nenhum efeito
 * de limpeza.
 */
export function ReceiptExplorer() {
  const [showsNotice, setShowsNotice] = useState(false);

  return (
    <>
      <Button
        data-testid="receipt-explorer"
        onClick={() => {
          setShowsNotice(true);
        }}
      >
        {RECEIPT_COPY.explorer}
      </Button>

      {showsNotice && (
        <output data-testid="receipt-explorer-notice" className="text-tan text-caption text-center">
          {RECEIPT_COPY.explorerNotice}
        </output>
      )}
    </>
  );
}
