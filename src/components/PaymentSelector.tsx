'use client';

import { QrCode, CreditCard, Banknote } from 'lucide-react';

export type PaymentMethod = 'PIX' | 'CARTAO' | 'DINHEIRO';

interface PaymentSelectorProps {
  selected: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
}

export default function PaymentSelector({ selected, onSelect }: PaymentSelectorProps) {
  const methods: {
    value: PaymentMethod;
    label: string;
    icon: React.ElementType;
  }[] = [
      { value: 'PIX', label: 'PIX', icon: QrCode },
      { value: 'CARTAO', label: 'CARTÃO', icon: CreditCard },
      { value: 'DINHEIRO', label: 'DINHEIRO', icon: Banknote },
    ];

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center gap-2 text-gray-700 mb-3">
        <CreditCard className="w-5 h-5 text-[#1F1312]" />
        <h2 className="font-semibold text-[#1F1312]">Pagamento</h2>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {methods.map((method) => {
          const Icon = method.icon;

          return (
            <button
              key={method.value}
              onClick={() => onSelect(method.value)}
              className={`px-4 py-4 rounded-lg border-2 font-semibold text-lg transition-all flex flex-col items-center gap-2 ${selected === method.value
                  ? 'border-[#1F1312] bg-[#E6E1CF] text-[#1F1312] shadow-md'
                  : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                }`}
            >
              <Icon
                size={28}
                className={selected === method.value ? 'text-[#1F1312]' : 'text-gray-500'}
              />
              <span>{method.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
