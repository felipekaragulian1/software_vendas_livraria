'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  ShoppingCart,
  CreditCard,
  Search,
  CheckCircle2,
  Receipt,
} from 'lucide-react';

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
  const [saleComplete, setSaleComplete] = useState<any>(null);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
  };

  const handleAddProduct = (product: Product) => {
    const existing = cart.find((i) => i.produtoId === product.id);

    if (existing) {
      setCart(
        cart.map((item) =>
          item.produtoId === product.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        )
      );
    } else {
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

  const handleFinalizeSale = async () => {
    if (!cart.length || !paymentMethod) return;

    setIsProcessing(true);

    try {
      const result = await createSale({
        itens: cart.map((i) => ({
          produtoId: i.produtoId,
          quantidade: i.quantidade,
        })),
        formaPagamento: paymentMethod,
      });

      setSaleComplete(result);
      setCart([]);
      setPaymentMethod(null);
      showToast('Venda concluída com sucesso!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Erro ao finalizar venda', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (saleComplete) {
    return (
      <div className="min-h-screen bg-[#E6E1CF] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-1">Venda Concluída</h1>
          <p className="text-gray-500 mb-6">Pedido #{saleComplete.pedidoId}</p>

          <div className="flex justify-between items-center bg-gray-50 rounded-lg p-4 mb-6">
            <span className="font-medium">Total</span>
            <span className="text-2xl font-bold text-green-600">
              R$ {saleComplete.total.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <button
            onClick={() => setSaleComplete(null)}
            className="w-full py-3 bg-[#F5F3ED] text-[#1F1312] rounded-xl font-semibold hover:opacity-90 transition"
          >
            Nova Venda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E6E1CF] to-[#F2EFE6]">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <header className="bg-white border-b border-[#E6E1CF]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo-GS.png" alt="GS Store" width={48} height={48} />
            <div>
              <h1 className="text-xl font-bold">PDV</h1>
              <p className="text-sm text-gray-500">Nova venda</p>
            </div>
          </div>

          <button
            onClick={() => router.push('/')}
            className="px-5 py-2.5 text-[#1F1312] hover:text-[#1F1312] bg-white hover:bg-[#E6E1CF] rounded-xl transition-all shadow-sm hover:shadow-md border border-[#E6E1CF] flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Voltar
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-gray-500">
            <Search className="w-4 h-4 text-[#1F1312]" />
            <span className="text-sm text-[#1F1312]">Buscar produto</span>
          </div>
          <SearchBox onSelectProduct={handleAddProduct} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
       
            <Cart
              items={cart}
              onUpdateQuantity={(id, q) =>
                setCart(cart.map((i) => (i.produtoId === id ? { ...i, quantidade: q } : i)))
              }
              onRemoveItem={(id) => setCart(cart.filter((i) => i.produtoId !== id))}
            />
          </div>

          <aside className="space-y-4">
            <PaymentSelector selected={paymentMethod} onSelect={setPaymentMethod} />
            <CheckoutSummary
              items={cart}
              paymentMethod={paymentMethod}
              onFinalize={handleFinalizeSale}
              isProcessing={isProcessing}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}
