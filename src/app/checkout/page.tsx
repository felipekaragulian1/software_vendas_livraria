'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SearchBox from '@/components/SearchBox';
import Cart from '@/components/Cart';
import PaymentSelector, { PaymentMethod } from '@/components/PaymentSelector';
import CheckoutSummary from '@/components/CheckoutSummary';
import Toast, { ToastType } from '@/components/Toast';
import { Product, CartItem, createSale } from '@/lib/api';

interface ToastState {
  message: string;
  type: ToastType;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [saleComplete, setSaleComplete] = useState<{
    pedidoId: number;
    total: number;
    itens: Array<{ nome: string; quantidade: number; subtotal: number }>;
  } | null>(null);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
  };

  const handleAddProduct = (product: Product) => {
    const existingItem = cart.find((item) => item.produtoId === product.id);

    if (existingItem) {
      // Incrementa quantidade se já existe
      setCart(
        cart.map((item) =>
          item.produtoId === product.id
            ? { ...item, quantidade: item.quantidade + 1, estoqueAtual: product.estoque }
            : item
        )
      );
    } else {
      // Adiciona novo item
      setCart([
        ...cart,
        {
          produtoId: product.id,
          nome: product.nome,
          preco: product.preco,
          quantidade: 1,
          estoqueAtual: product.estoque,
        },
      ]);
    }

    showToast(`${product.nome} adicionado ao carrinho`, 'success');
  };

  const handleUpdateQuantity = (produtoId: number, quantidade: number) => {
    if (quantidade <= 0) {
      handleRemoveItem(produtoId);
      return;
    }

    setCart(
      cart.map((item) =>
        item.produtoId === produtoId ? { ...item, quantidade } : item
      )
    );
  };

  const handleRemoveItem = (produtoId: number) => {
    setCart(cart.filter((item) => item.produtoId !== produtoId));
  };

  const handleFinalizeSale = async () => {
    if (cart.length === 0 || !paymentMethod) {
      return;
    }

    setIsProcessing(true);

    try {
      const payload = {
        itens: cart.map((item) => ({
          produtoId: item.produtoId,
          quantidade: item.quantidade,
        })),
        formaPagamento: paymentMethod,
      };

      const result = await createSale(payload);

      // Sucesso: limpar carrinho e mostrar resumo
      setSaleComplete({
        pedidoId: result.pedidoId,
        total: result.total,
        itens: result.itens.map((item) => ({
          nome: item.nome,
          quantidade: item.quantidade,
          subtotal: item.subtotal,
        })),
      });

      setCart([]);
      setPaymentMethod(null);
      showToast('Venda concluída com sucesso!', 'success');
    } catch (error: any) {
      console.error('Erro ao finalizar venda:', error);
      
      // Manter carrinho e mostrar erro
      const errorMessage = error.message || 'Erro ao processar venda';
      
      if (errorMessage.includes('Estoque insuficiente')) {
        showToast('Estoque insuficiente para um ou mais produtos', 'error');
      } else if (errorMessage.includes('conexão') || errorMessage.includes('network')) {
        showToast('Erro de conexão. Verifique sua internet.', 'error');
      } else {
        showToast(errorMessage, 'error');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewSale = () => {
    setSaleComplete(null);
    setCart([]);
    setPaymentMethod(null);
    // Foco volta ao campo de busca (será feito pelo SearchBox)
  };

  // Tela de venda concluída
  if (saleComplete) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">✅</div>
              <h1 className="text-3xl font-bold text-green-600 mb-2">
                Venda Concluída!
              </h1>
              <p className="text-gray-600">
                Pedido #{saleComplete.pedidoId}
              </p>
            </div>

            <div className="border-t border-b py-4 mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-3xl font-bold text-blue-600">
                  R$ {saleComplete.total.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-gray-700 mb-2">Itens vendidos:</h3>
                {saleComplete.itens.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{item.nome}</p>
                      <p className="text-sm text-gray-500">
                        {item.quantidade}x
                      </p>
                    </div>
                    <p className="font-semibold">
                      R$ {item.subtotal.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleNewSale}
              className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              Nova Venda
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="container mx-auto p-4 md:p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              PDV - Nova Venda
            </h1>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ← Voltar
            </button>
          </div>

          <SearchBox onSelectProduct={handleAddProduct} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Carrinho - ocupa 2 colunas no desktop */}
          <div className="lg:col-span-2">
            <Cart
              items={cart}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
            />
          </div>

          {/* Sidebar - forma de pagamento e resumo */}
          <div className="lg:col-span-1 space-y-4">
            <PaymentSelector
              selected={paymentMethod}
              onSelect={setPaymentMethod}
            />
            <CheckoutSummary
              items={cart}
              paymentMethod={paymentMethod}
              onFinalize={handleFinalizeSale}
              isProcessing={isProcessing}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
