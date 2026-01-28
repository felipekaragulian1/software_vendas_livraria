'use client';

import { BarChart3, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#E6E1CF] flex flex-col">
      <div className="w-full bg-gray-100">
        <Image
          src="/telao-camisas.png"
          alt="GS Store Banner"
          width={1920}
          height={600}
          priority
          sizes="100vw"
          className="w-full h-auto object-contain"
        />
      </div>


      <section className="flex-1 flex items-center justify-center px-4 p-0 md:p-4">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-md p-3 sm:p-10 -mt-0 sm:-mt-52">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#1F1312] mb-3">
              Sistema de Gerenciamento de Vendas
            </h1>

            <p className="text-gray-600 text-sm sm:text-base max-w-xl mx-auto">
              Plataforma para controle de vendas, gerenciamento de estoque e
              baixa automática de livros vendidos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">

            <button
              onClick={() => router.push('/checkout')}
              className="
              group bg-white hover:bg-[#F2F1E6] rounded-2xl shadow-md
              hover:shadow-2xl focus:shadow-2xl
              transition-all duration-300
              p-8 sm:p-10
              flex flex-col items-center text-center
              hover:scale-[1.03]
            "
            >
              <h2 className="flex items-center gap-2 text-xl sm:text-2xl font-semibold text-gray-900 group-hover:text-[#1f0000] mb-2">
                <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7 text-gray-600 group-hover:text-[#1f0000]" />
                Nova Venda
              </h2>


              <p className="text-gray-500 text-sm sm:text-base group-hover:text-[#1f0000]/60">
                Iniciar uma nova venda no PDV
              </p>
            </button>

            <button
              onClick={() => router.push('/reports')}
              className="
              group bg-white hover:bg-[#F2F1E6] rounded-2xl shadow-md
              hover:shadow-2xl focus:shadow-2xl
              transition-all duration-300
              p-8 sm:p-10
              flex flex-col items-center text-center
              hover:scale-[1.03]
            "
            >
              <h2 className="flex items-center gap-2 text-xl sm:text-2xl font-semibold text-gray-900 group-hover:text-[#1f0000] mb-2">
                <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 text-gray-600 group-hover:text-[#1f0000]" />
                Relatórios
              </h2>


              <p className="text-gray-500 text-sm sm:text-base">
                Visualizar relatórios de vendas
              </p>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
