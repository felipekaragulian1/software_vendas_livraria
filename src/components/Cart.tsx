'use client';

import { CartItem } from '@/lib/api';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (produtoId: number, quantidade: number) => void;
  onRemoveItem: (produtoId: number) => void;
}

export default function Cart({ items, onUpdateQuantity, onRemoveItem }: CartProps) {
  const validItems = items.filter(
    (item) => item.estoqueAtual > 0
  );
  
  const subtotal = validItems.reduce(
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
      <div className="bg-white rounded-xl border p-8 h-full flex flex-col items-center justify-center text-center">
        <ShoppingCart size={40} className="text-gray-300 mb-3" />
        <p className="text-gray-500 font-medium">Seu carrinho está vazio</p>
        <span className="text-sm text-gray-400">
          Adicione produtos para continuar
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 h-full flex flex-col shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-[#1F1312]" />
          <h2 className="font-semibold text-[#1F1312]">Carrinho</h2>
        </div>

        <span className="text-sm font-medium bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
          {items.length} {items.length === 1 ? 'item' : 'itens'}
        </span>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {items.map((item) => {
          const itemSubtotal = item.preco * item.quantidade;
          const estoqueWarning = item.quantidade > item.estoqueAtual;

          return (
            <div
              key={item.produtoId}
              className="rounded-xl border border-gray-200 p-4 bg-gray-50/40 hover:bg-gray-50 transition"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900">
                    {item.nome}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Código #{item.produtoId}
                  </p>
                </div>

                <button
                  onClick={() => onRemoveItem(item.produtoId)}
                  className="text-gray-400 hover:text-red-500 transition"
                  title="Remover item"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {estoqueWarning && (
                <div className="mt-2 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md px-2 py-1">
                  Quantidade acima do estoque disponível ({item.estoqueAtual})
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                {/* Quantidade */}
                <div className="flex items-center gap-1 bg-white border rounded-lg px-1 py-1">
                  <button
                    onClick={() => handleQuantityChange(item.produtoId, -1)}
                    className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-gray-100"
                  >
                    <Minus size={14} />
                  </button>

                  <span className="w-8 text-center text-sm font-medium">
                    {item.quantidade}
                  </span>

                  <button
                    onClick={() => handleQuantityChange(item.produtoId, 1)}
                    className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-gray-100"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Preço */}
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    R$ {item.preco.toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    R$ {itemSubtotal.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t px-6 py-4 bg-gray-50">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">
            Subtotal
          </span>
          <span className="text-xl font-bold text-gray-900">
            R$ {subtotal.toFixed(2).replace('.', ',')}
          </span>
        </div>
      </div>
    </div>
  );

}
