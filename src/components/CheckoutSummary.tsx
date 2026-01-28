'use client';

import { CartItem } from '@/lib/api';
import { PaymentMethod } from './PaymentSelector';
import { Receipt } from 'lucide-react';

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
  const validItems = items.filter(
    (item) => item.estoqueAtual > 0
  );
  
  const subtotal = validItems.reduce(
    (sum, item) => sum + item.preco * item.quantidade,
    0
  );
  
  const canFinalize =
    validItems.length > 0 &&
    paymentMethod !== null &&
    !isProcessing;
  

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm sticky bottom-0 md:relative md:top-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Receipt className="w-5 h-5 text-[#1F1312]" />
        <h2 className="font-semibold text-[#1F1312]">Resumo da compra</h2>
      </div>

      {/* Valores */}
      <div className="space-y-3 mb-5">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Itens</span>
          <span>{validItems.length}</span>
        </div>

        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
        </div>

        <div className="pt-3 border-t flex justify-between items-center">
          <span className="text-base font-semibold text-gray-800">
            Total
          </span>
          <span className="text-2xl font-bold text-gray-900">
          R$ {subtotal.toFixed(2).replace('.', ',')}
          </span>
        </div>
      </div>

      {/* Método de pagamento */}
      {paymentMethod && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
          <span className="text-gray-600">Pagamento</span>
          <strong className="text-gray-900">{paymentMethod}</strong>
        </div>
      )}

      {/* Botão */}
      <button
        onClick={onFinalize}
        disabled={!canFinalize}
        className={`w-full py-4 rounded-xl font-semibold text-base transition-all
          ${canFinalize
            ? 'bg-[#E6E1CF] text-[#1F1312] shadow-md hover:shadow-lg'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Processando...
          </span>
        ) : (
          'Finalizar venda'
        )}
      </button>

      {/* Mensagens de ajuda */}
      {items.length === 0 && (
        <p className="mt-3 text-xs text-center text-gray-500">
          Adicione produtos ao carrinho
        </p>
      )}

      {items.length > 0 && !paymentMethod && (
        <p className="mt-3 text-xs text-center text-gray-500">
          Selecione a forma de pagamento
        </p>
      )}
    </div>
  );

}
