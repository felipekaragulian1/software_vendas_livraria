'use client';

export type PaymentMethod = 'PIX' | 'CARTAO' | 'DINHEIRO';

interface PaymentSelectorProps {
  selected: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
}

export default function PaymentSelector({ selected, onSelect }: PaymentSelectorProps) {
  const methods: { value: PaymentMethod; label: string; icon: string }[] = [
    { value: 'PIX', label: 'PIX', icon: '📱' },
    { value: 'CARTAO', label: 'CARTÃO', icon: '💳' },
    { value: 'DINHEIRO', label: 'DINHEIRO', icon: '💵' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-3">Forma de Pagamento</h3>
      <div className="grid grid-cols-3 gap-3">
        {methods.map((method) => (
          <button
            key={method.value}
            onClick={() => onSelect(method.value)}
            className={`px-4 py-4 rounded-lg border-2 font-semibold text-lg transition-all ${
              selected === method.value
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
            }`}
          >
            <div className="text-2xl mb-1">{method.icon}</div>
            <div>{method.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
