'use client';

import { CartItem } from '@/lib/api';
import { PaymentMethod } from './PaymentSelector';

interface CheckoutSummaryProps {
  items: CartItem[];
  paymentMethod: PaymentMethod | null;
  onFinalize: () => void;
  isProcessing: boolean;
}

export default function CheckoutSummary({
  items,
  paymentMethod,
  onFinalize,
  isProcessing,
}: CheckoutSummaryProps) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.preco * item.quantidade,
    0
  );

  const canFinalize = items.length > 0 && paymentMethod !== null && !isProcessing;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sticky bottom-0 md:relative md:sticky md:top-4">
      <h3 className="text-lg font-semibold mb-3">Resumo</h3>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-gray-600">
          <span>Itens:</span>
          <span>{items.length}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Subtotal:</span>
          <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
        </div>
        <div className="border-t pt-2 flex justify-between items-center">
          <span className="text-xl font-bold">Total:</span>
          <span className="text-2xl font-bold text-blue-600">
            R$ {subtotal.toFixed(2).replace('.', ',')}
          </span>
        </div>
      </div>

      {paymentMethod && (
        <div className="mb-4 p-2 bg-blue-50 rounded text-sm text-blue-700">
          Pagamento: <strong>{paymentMethod}</strong>
        </div>
      )}

      <button
        onClick={onFinalize}
        disabled={!canFinalize}
        className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
          canFinalize
            ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Finalizando...
          </span>
        ) : (
          'FINALIZAR VENDA'
        )}
      </button>

      {items.length === 0 && (
        <p className="text-sm text-gray-500 text-center mt-2">
          Adicione itens ao carrinho
        </p>
      )}
      {items.length > 0 && !paymentMethod && (
        <p className="text-sm text-gray-500 text-center mt-2">
          Selecione a forma de pagamento
        </p>
      )}
    </div>
  );
}
