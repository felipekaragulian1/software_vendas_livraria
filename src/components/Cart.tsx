'use client';

import { CartItem } from '@/lib/api';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (produtoId: number, quantidade: number) => void;
  onRemoveItem: (produtoId: number) => void;
}

export default function Cart({ items, onUpdateQuantity, onRemoveItem }: CartProps) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.preco * item.quantidade,
    0
  );

  const handleQuantityChange = (produtoId: number, delta: number) => {
    const item = items.find((i) => i.produtoId === produtoId);
    if (!item) return;

    const newQuantity = item.quantidade + delta;
    if (newQuantity > 0) {
      onUpdateQuantity(produtoId, newQuantity);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 h-full flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="text-2xl mb-2">🛒</p>
          <p>Carrinho vazio</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 pb-2 border-b">
        <h2 className="text-xl font-bold">Carrinho</h2>
        <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
          {items.length} {items.length === 1 ? 'item' : 'itens'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {items.map((item) => {
          const itemSubtotal = item.preco * item.quantidade;
          const estoqueWarning = item.quantidade > item.estoqueAtual;

          return (
            <div
              key={item.produtoId}
              className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.nome}</h3>
                  <p className="text-sm text-gray-500">ID: {item.produtoId}</p>
                </div>
                <button
                  onClick={() => onRemoveItem(item.produtoId)}
                  className="text-red-500 hover:text-red-700 text-xl font-bold ml-2"
                  title="Remover item"
                >
                  ×
                </button>
              </div>

              {estoqueWarning && (
                <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                  ⚠ Atenção: quantidade maior que estoque disponível ({item.estoqueAtual})
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuantityChange(item.produtoId, -1)}
                    className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded font-bold text-lg flex items-center justify-center transition-colors"
                  >
                    −
                  </button>
                  <span className="w-12 text-center font-semibold text-lg">
                    {item.quantidade}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(item.produtoId, 1)}
                    className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded font-bold text-lg flex items-center justify-center transition-colors"
                  >
                    +
                  </button>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-500">R$ {item.preco.toFixed(2).replace('.', ',')}</p>
                  <p className="font-bold text-blue-600">
                    R$ {itemSubtotal.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Subtotal:</span>
          <span className="text-lg font-semibold">
            R$ {subtotal.toFixed(2).replace('.', ',')}
          </span>
        </div>
      </div>
    </div>
  );
}
