'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Software de Vendas
          </h1>
          <p className="text-xl text-gray-600">
            Livraria - PDV
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => router.push('/checkout')}
            className="group bg-white rounded-xl shadow-lg hover:shadow-2xl p-8 md:p-12 transition-all transform hover:scale-105"
          >
            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
              🛒
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Nova Venda
            </h2>
            <p className="text-gray-600">
              Iniciar uma nova venda no PDV
            </p>
          </button>

          <button
            onClick={() => router.push('/reports')}
            className="group bg-white rounded-xl shadow-lg hover:shadow-2xl p-8 md:p-12 transition-all transform hover:scale-105"
          >
            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
              📊
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Relatórios
            </h2>
            <p className="text-gray-600">
              Visualizar relatórios de vendas
            </p>
          </button>
        </div>
      </div>
    </main>
  );
}
