import { CART_TABLE_COLUMNS } from '@/features/cart/constants/cart';

/**
 * Linha de esqueleto da tabela.
 *
 * Vive **dentro** do `tbody`, e não no lugar da tabela inteira: assim o
 * cabeçalho e as larguras de coluna já estão na tela desde o primeiro quadro, e
 * a chegada dos dados não desloca nada (nem a coluna do resumo ao lado).
 */
export function CartTableRowSkeleton() {
  return (
    <tr aria-hidden="true">
      {Array.from({ length: CART_TABLE_COLUMNS }, (_unused, index) => (
        // Placeholders são posicionais: o índice é o único identificador que existe.
        <td key={index} className="border-t-[13px] border-t-transparent p-0">
          <div className="skeleton h-[70px] w-full" />
        </td>
      ))}
    </tr>
  );
}
