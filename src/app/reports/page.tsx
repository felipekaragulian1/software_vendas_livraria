'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchReports, ReportData } from '@/lib/api';
import Toast, { ToastType } from '@/components/Toast';

interface ToastState {
  message: string;
  type: ToastType;
}

export default function ReportsPage() {
  const router = useRouter();
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'week' | 'custom'>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
  };

  const getDateRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (dateFilter) {
      case 'today': {
        const from = today.toISOString().split('T')[0];
        return { from, to: from };
      }
      case 'yesterday': {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const from = yesterday.toISOString().split('T')[0];
        return { from, to: from };
      }
      case 'week': {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const from = weekAgo.toISOString().split('T')[0];
        const to = today.toISOString().split('T')[0];
        return { from, to };
      }
      case 'custom': {
        return { from: customFrom, to: customTo };
      }
      default:
        return { from: '', to: '' };
    }
  };

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const { from, to } = getDateRange();
      const reports = await fetchReports(from || undefined, to || undefined);
      setData(reports);
    } catch (error: any) {
      console.error('Erro ao carregar relatórios:', error);
      showToast('Erro ao carregar relatórios', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (dateFilter !== 'custom') {
      loadReports();
    }
  }, [dateFilter]);

  const handleCustomDateLoad = () => {
    if (!customFrom || !customTo) {
      showToast('Selecione as datas inicial e final', 'warning');
      return;
    }
    loadReports();
  };

  const exportToCSV = () => {
    if (!data) return;

    const csvRows: string[] = [];
    const { from, to } = getDateRange();
    const periodo = from && to ? `${from} a ${to}` : from || to || 'Período não especificado';

    // Cabeçalho
    csvRows.push('RELATÓRIO DE VENDAS');
    csvRows.push(`Período: ${periodo}`);
    csvRows.push(`Data de Exportação: ${new Date().toLocaleString('pt-BR')}`);
    csvRows.push('');

    // ===== RELATÓRIO COMPLETO POR ID DE PRODUTO (TODOS OS PRODUTOS) =====
    csvRows.push('═══════════════════════════════════════════════════════════');
    csvRows.push('RELATÓRIO COMPLETO POR ID DE PRODUTO');
    csvRows.push('═══════════════════════════════════════════════════════════');
    csvRows.push('ID,Produto,Quantidade Vendida,Estoque Disponível,Preço Atual,Valor Unitário Médio,Total Faturado');
    
    // Usar todosProdutosPorId que inclui TODOS os produtos (até os que não foram vendidos)
    if (data.todosProdutosPorId && data.todosProdutosPorId.length > 0) {
      data.todosProdutosPorId.forEach((prod) => {
        const valorUnitarioMedio = prod.quantidadeVendida > 0 
          ? (prod.totalFaturado / prod.quantidadeVendida).toFixed(2)
          : '0.00';
        
        csvRows.push(
          `${prod.id},"${prod.nome}",${prod.quantidadeVendida},${prod.estoqueDisponivel},${prod.precoAtual.toFixed(2)},${valorUnitarioMedio},${prod.totalFaturado.toFixed(2)}`
        );
      });
    } else if (data.todosProdutosVendidos && data.todosProdutosVendidos.length > 0) {
      // Fallback: usar todosProdutosVendidos se todosProdutosPorId não estiver disponível
      data.todosProdutosVendidos.forEach((prod) => {
        const valorUnitarioMedio = prod.totalQuantidadeVendida > 0 
          ? (prod.totalFaturamento / prod.totalQuantidadeVendida).toFixed(2)
          : '0.00';
        
        csvRows.push(
          `${prod.id},"${prod.nome}",${prod.totalQuantidadeVendida},${prod.estoqueAtual},${prod.precoAtual.toFixed(2)},${valorUnitarioMedio},${prod.totalFaturamento.toFixed(2)}`
        );
      });
    } else {
      // Fallback final: usar topProdutosQuantidade
      data.topProdutosQuantidade.forEach((prod) => {
        const valorUnitarioMedio = prod.totalQuantidade > 0 
          ? (prod.totalFaturamento / prod.totalQuantidade).toFixed(2)
          : '0.00';
        
        csvRows.push(
          `${prod.id},"${prod.nome}",${prod.totalQuantidade},N/A,N/A,${valorUnitarioMedio},${prod.totalFaturamento.toFixed(2)}`
        );
      });
    }
    
    csvRows.push('');

    // ===== RESUMO GERAL =====
    csvRows.push('═══════════════════════════════════════════════════════════');
    csvRows.push('RESUMO GERAL');
    csvRows.push('═══════════════════════════════════════════════════════════');
    csvRows.push(`Total Vendido,R$ ${totalVendido.toFixed(2).replace('.', ',')}`);
    csvRows.push(`Número de Vendas,${totalPedidos}`);
    csvRows.push(`Ticket Médio,R$ ${ticketMedio.toFixed(2).replace('.', ',')}`);
    csvRows.push('');

    // ===== TOTAL POR DIA =====
    csvRows.push('═══════════════════════════════════════════════════════════');
    csvRows.push('TOTAL VENDIDO POR DIA');
    csvRows.push('═══════════════════════════════════════════════════════════');
    csvRows.push('Data,Total Vendido,Num Pedidos');
    data.totalVendidoPorDia.forEach((day) => {
      csvRows.push(
        `${day.data},${day.totalVendido.toFixed(2)},${day.numPedidos}`
      );
    });
    csvRows.push('');

    // ===== TOTAL POR FORMA DE PAGAMENTO =====
    if (data.totalPorFormaPagamento.length > 0) {
      csvRows.push('═══════════════════════════════════════════════════════════');
      csvRows.push('TOTAL POR FORMA DE PAGAMENTO');
      csvRows.push('═══════════════════════════════════════════════════════════');
      csvRows.push('Forma de Pagamento,Total');
      data.totalPorFormaPagamento.forEach((fp) => {
        csvRows.push(`"${fp.formaPagamento}",${fp.total.toFixed(2)}`);
      });
      csvRows.push('');
    }

    // ===== TOP PRODUTOS POR QUANTIDADE =====
    csvRows.push('═══════════════════════════════════════════════════════════');
    csvRows.push('TOP 10 PRODUTOS POR QUANTIDADE');
    csvRows.push('═══════════════════════════════════════════════════════════');
    csvRows.push('ID,Produto,Quantidade,Faturamento');
    data.topProdutosQuantidade.forEach((prod) => {
      csvRows.push(
        `${prod.id},"${prod.nome}",${prod.totalQuantidade},${prod.totalFaturamento.toFixed(2)}`
      );
    });
    csvRows.push('');

    // ===== TOP PRODUTOS POR FATURAMENTO =====
    csvRows.push('═══════════════════════════════════════════════════════════');
    csvRows.push('TOP 10 PRODUTOS POR FATURAMENTO');
    csvRows.push('═══════════════════════════════════════════════════════════');
    csvRows.push('ID,Produto,Quantidade,Faturamento');
    data.topProdutosFaturamento.forEach((prod) => {
      csvRows.push(
        `${prod.id},"${prod.nome}",${prod.totalQuantidade},${prod.totalFaturamento.toFixed(2)}`
      );
    });

    // Gerar CSV
    const csvContent = csvRows.join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM para Excel
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const fileName = `relatorio-vendas-${periodo.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Relatório exportado com sucesso!', 'success');
  };

  const totalVendido = data?.totalVendidoPorDia.reduce(
    (sum, day) => sum + day.totalVendido,
    0
  ) || 0;

  const totalPedidos = data?.totalVendidoPorDia.reduce(
    (sum, day) => sum + day.numPedidos,
    0
  ) || 0;

  const ticketMedio = totalPedidos > 0 ? totalVendido / totalPedidos : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Relatórios de Vendas
          </h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← Voltar
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filtros</h2>
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={() => setDateFilter('today')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                dateFilter === 'today'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => setDateFilter('yesterday')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                dateFilter === 'yesterday'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Ontem
            </button>
            <button
              onClick={() => setDateFilter('week')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                dateFilter === 'week'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              7 Dias
            </button>
            <button
              onClick={() => setDateFilter('custom')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                dateFilter === 'custom'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Personalizado
            </button>
          </div>

          {dateFilter === 'custom' && (
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Final
                </label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <button
                onClick={handleCustomDateLoad}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold"
              >
                Carregar
              </button>
            </div>
          )}

          {data && (
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                title="Exportar relatório completo em CSV (inclui produto e quantidade)"
              >
                📥 Exportar CSV Completo
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando relatórios...</p>
          </div>
        ) : data ? (
          <>
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Total Vendido
                </h3>
                <p className="text-3xl font-bold text-blue-600">
                  R$ {totalVendido.toFixed(2).replace('.', ',')}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Número de Vendas
                </h3>
                <p className="text-3xl font-bold text-green-600">
                  {totalPedidos}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Ticket Médio
                </h3>
                <p className="text-3xl font-bold text-purple-600">
                  R$ {ticketMedio.toFixed(2).replace('.', ',')}
                </p>
              </div>
            </div>

            {/* Relatório Completo por ID de Produto - Destaque */}
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Relatório Completo por ID de Produto</h2>
                <span className="text-sm text-gray-500">
                  {data.todosProdutosPorId?.length || data.todosProdutosVendidos?.length || data.topProdutosQuantidade.length} produtos
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-300 bg-gray-50">
                      <th className="text-left py-3 px-4 font-semibold">ID</th>
                      <th className="text-left py-3 px-4 font-semibold">Produto</th>
                      <th className="text-right py-3 px-4 font-semibold">Qtd Vendida</th>
                      <th className="text-right py-3 px-4 font-semibold">Estoque Disponível</th>
                      <th className="text-right py-3 px-4 font-semibold">Preço Atual</th>
                      <th className="text-right py-3 px-4 font-semibold">Valor Unit. Médio</th>
                      <th className="text-right py-3 px-4 font-semibold">Total Faturado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.todosProdutosPorId || data.todosProdutosVendidos || data.topProdutosQuantidade).slice(0, 50).map((prod: any, index: number) => {
                      const quantidadeVendida = prod.quantidadeVendida || prod.totalQuantidadeVendida || prod.totalQuantidade || 0;
                      const totalFaturado = prod.totalFaturado || prod.totalFaturamento || 0;
                      const valorUnitarioMedio = quantidadeVendida > 0 
                        ? (totalFaturado / quantidadeVendida)
                        : 0;
                      const estoqueDisponivel = prod.estoqueDisponivel !== undefined 
                        ? prod.estoqueDisponivel 
                        : prod.estoqueAtual !== undefined 
                          ? prod.estoqueAtual 
                          : null;
                      const precoAtual = prod.precoAtual || 0;
                      
                      return (
                        <tr 
                          key={prod.id} 
                          className={`border-b hover:bg-blue-50 transition-colors ${
                            index < 3 ? 'bg-blue-50/30' : ''
                          } ${quantidadeVendida === 0 ? 'opacity-60' : ''}`}
                        >
                          <td className="py-3 px-4 font-mono text-sm text-gray-600">{prod.id}</td>
                          <td className="py-3 px-4 font-medium">{prod.nome}</td>
                          <td className={`text-right py-3 px-4 font-bold ${
                            quantidadeVendida > 0 ? 'text-blue-600' : 'text-gray-400'
                          }`}>
                            {quantidadeVendida}
                          </td>
                          <td className={`text-right py-3 px-4 font-semibold ${
                            estoqueDisponivel !== null 
                              ? estoqueDisponivel === 0 
                                ? 'text-red-600' 
                                : estoqueDisponivel < 10 
                                  ? 'text-yellow-600' 
                                  : 'text-green-600'
                              : 'text-gray-400'
                          }`}>
                            {estoqueDisponivel !== null ? estoqueDisponivel : 'N/A'}
                          </td>
                          <td className="text-right py-3 px-4 text-gray-600">
                            {precoAtual > 0 ? `R$ ${precoAtual.toFixed(2).replace('.', ',')}` : 'N/A'}
                          </td>
                          <td className="text-right py-3 px-4 text-gray-600">
                            {valorUnitarioMedio > 0 ? `R$ ${valorUnitarioMedio.toFixed(2).replace('.', ',')}` : '-'}
                          </td>
                          <td className={`text-right py-3 px-4 font-semibold ${
                            totalFaturado > 0 ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            {totalFaturado > 0 ? `R$ ${totalFaturado.toFixed(2).replace('.', ',')}` : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {(data.todosProdutosPorId?.length || data.todosProdutosVendidos?.length || 0) > 50 && (
                  <div className="mt-4 text-center text-sm text-gray-500">
                    Mostrando 50 de {data.todosProdutosPorId?.length || data.todosProdutosVendidos?.length || 0} produtos. 
                    Exporte o CSV para ver todos os produtos por ID.
                  </div>
                )}
              </div>
            </div>

            {/* Top Produtos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
                <h2 className="text-xl font-bold mb-4">Top Produtos por Quantidade</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">Produto</th>
                        <th className="text-right py-2 px-2">Qtd</th>
                        <th className="text-right py-2 px-2">Faturamento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topProdutosQuantidade.map((prod) => (
                        <tr key={prod.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-2">{prod.nome}</td>
                          <td className="text-right py-2 px-2 font-semibold">
                            {prod.totalQuantidade}
                          </td>
                          <td className="text-right py-2 px-2">
                            R$ {prod.totalFaturamento.toFixed(2).replace('.', ',')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
                <h2 className="text-xl font-bold mb-4">Top Produtos por Faturamento</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">Produto</th>
                        <th className="text-right py-2 px-2">Qtd</th>
                        <th className="text-right py-2 px-2">Faturamento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topProdutosFaturamento.map((prod) => (
                        <tr key={prod.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-2">{prod.nome}</td>
                          <td className="text-right py-2 px-2 font-semibold">
                            {prod.totalQuantidade}
                          </td>
                          <td className="text-right py-2 px-2">
                            R$ {prod.totalFaturamento.toFixed(2).replace('.', ',')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Total por Forma de Pagamento */}
            {data.totalPorFormaPagamento.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
                <h2 className="text-xl font-bold mb-4">Total por Forma de Pagamento</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {data.totalPorFormaPagamento.map((fp) => (
                    <div
                      key={fp.formaPagamento}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <p className="text-sm text-gray-500 mb-1">
                        {fp.formaPagamento}
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        R$ {fp.total.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-500">
            Selecione um filtro para ver os relatórios
          </div>
        )}
      </div>
    </div>
  );
}
