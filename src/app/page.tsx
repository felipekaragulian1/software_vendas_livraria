'use client';

import { BarChart3, ShoppingCart, Package } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#E6E1CF] to-[#F2EFE6] flex flex-col">

      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full bg-gray-100"
      >
        <Image
          src="/banner-GS.png"
          alt="Banner GS"
          width={1920}
          height={600}
          priority
          sizes="100vw"
          className="w-full h-auto object-contain"
        />
      </motion.div>

      <section className="flex-1 flex items-center justify-center px-4 md:p-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
          className="w-full max-w-3xl bg-white rounded-2xl shadow-md p-3 sm:p-10 sm:-mt-52 border border-[#E6E1CF]"
        >

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.4 }}
            className="flex justify-center"
          >
            <Image
              src="/logo-GS.png"
              alt="Logo GS Store"
              width={140}
              height={140}
              className="object-contain"
            />
          </motion.div>

          <div className="text-center mt-4">
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#1F1312] mb-3">
              Sistema de Gerenciamento de Vendas
            </h1>

            <p className="text-gray-600 text-sm sm:text-base max-w-xl mx-auto">
              Plataforma para controle de vendas, gerenciamento de estoque e
              baixa automática de livros vendidos.
            </p>
          </div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.15 },
              },
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6"
          >
            <motion.button
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              onClick={() => router.push('/checkout')}
              className="
                group bg-white hover:bg-[#F2F1E6] rounded-2xl shadow-md
                hover:shadow-2xl transition-all duration-300
                p-8 sm:p-10 flex flex-col items-center text-center
                hover:scale-[1.03]
              "
            >
              <h2 className="flex items-center gap-2 text-xl sm:text-2xl font-semibold text-gray-900 group-hover:text-[#1f0000] mb-2">
                <ShoppingCart className="w-6 h-6 text-gray-600 group-hover:text-[#1f0000]" />
                Nova Venda
              </h2>

              <p className="text-gray-500 text-sm sm:text-base group-hover:text-[#1f0000]/60">
                Iniciar uma nova venda no PDV
              </p>
            </motion.button>

            <motion.button
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              onClick={() => router.push('/reports')}
              className="
                group bg-white hover:bg-[#F2F1E6] rounded-2xl shadow-md
                hover:shadow-2xl transition-all duration-300
                p-8 sm:p-10 flex flex-col items-center text-center
                hover:scale-[1.03]
              "
            >
              <h2 className="flex items-center gap-2 text-xl sm:text-2xl font-semibold text-gray-900 group-hover:text-[#1f0000] mb-2">
                <BarChart3 className="w-6 h-6 text-gray-600 group-hover:text-[#1f0000]" />
                Relatórios
              </h2>

              <p className="text-gray-500 text-sm sm:text-base group-hover:text-[#1f0000]/60">
                Visualizar relatórios de vendas
              </p>
            </motion.button>

            <motion.button
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              onClick={() => router.push('/estoque')}
              className="
                group bg-white hover:bg-[#F2F1E6] rounded-2xl shadow-md
                hover:shadow-2xl transition-all duration-300
                p-8 sm:p-10 flex flex-col items-center text-center
                hover:scale-[1.03]
              "
            >
              <h2 className="flex items-center gap-2 text-xl sm:text-2xl font-semibold text-gray-900 group-hover:text-[#1f0000] mb-2">
                <Package className="w-6 h-6 text-gray-600 group-hover:text-[#1f0000]" />
                Estoque
              </h2>

              <p className="text-gray-500 text-sm sm:text-base group-hover:text-[#1f0000]/60">
                Cadastrar SKU ou adicionar quantidade
              </p>
            </motion.button>
          </motion.div>
        </motion.div>
      </section>
    </main>
  );
}
