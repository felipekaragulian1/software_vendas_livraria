'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchReports, ReportData } from '@/lib/api';
import Toast, { ToastType } from '@/components/Toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, ShoppingCart, TrendingUp, Download, ArrowLeft, Calendar, CreditCard, QrCode, Banknote } from 'lucide-react';

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
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
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
    <div className="min-h-screen bg-[#F5F3ED] p-4 md:p-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#1F1312] mb-2">
              Relatórios de Vendas
            </h1>
            <p className="text-[#1F1312]/70">Análise detalhada de performance</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-5 py-2.5 text-[#1F1312] hover:text-[#1F1312] bg-white hover:bg-[#E6E1CF] rounded-xl transition-all shadow-sm hover:shadow-md border border-[#E6E1CF] flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Voltar
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-[#E6E1CF] p-6 mb-8">
          <div className="flex items-center gap-2 mb-5">
            <Calendar size={20} className="text-[#1F1312]" />
            <h2 className="text-lg font-bold text-[#1F1312]">Período de Análise</h2>
          </div>
          <div className="flex flex-wrap gap-3 mb-5">
            <button
              onClick={() => setDateFilter('today')}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm ${dateFilter === 'today'
                ? 'bg-[#1F1312] text-white shadow-md'
                : 'bg-[#E6E1CF] text-[#1F1312] hover:bg-[#D6D1BF]'
                }`}
            >
              Hoje
            </button>
            <button
              onClick={() => setDateFilter('yesterday')}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm ${dateFilter === 'yesterday'
                ? 'bg-[#1F1312] text-white shadow-md'
                : 'bg-[#E6E1CF] text-[#1F1312] hover:bg-[#D6D1BF]'
                }`}
            >
              Ontem
            </button>
            <button
              onClick={() => setDateFilter('week')}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm ${dateFilter === 'week'
                ? 'bg-[#1F1312] text-white shadow-md'
                : 'bg-[#E6E1CF] text-[#1F1312] hover:bg-[#D6D1BF]'
                }`}
            >
              7 Dias
            </button>
            <button
              onClick={() => setDateFilter('custom')}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm ${dateFilter === 'custom'
                ? 'bg-[#1F1312] text-white shadow-md'
                : 'bg-[#E6E1CF] text-[#1F1312] hover:bg-[#D6D1BF]'
                }`}
            >
              Personalizado
            </button>
          </div>

          {dateFilter === 'custom' && (
            <div className="flex flex-col md:flex-row gap-4 items-end bg-[#E6E1CF]/30 p-4 rounded-xl">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-[#1F1312] mb-2">
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[#E6E1CF] rounded-xl focus:border-[#1F1312] focus:ring-2 focus:ring-[#E6E1CF] focus:outline-none transition-all text-[#1F1312]"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-[#1F1312] mb-2">
                  Data Final
                </label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[#E6E1CF] rounded-xl focus:border-[#1F1312] focus:ring-2 focus:ring-[#E6E1CF] focus:outline-none transition-all text-[#1F1312]"
                />
              </div>
              <button
                onClick={handleCustomDateLoad}
                className="px-6 py-2.5 bg-[#1F1312] hover:bg-[#2F2322] text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
              >
                Carregar
              </button>
            </div>
          )}

          {data && (
            <div className="mt-5 flex justify-end">
              <button
                onClick={exportToCSV}
                className="px-5 py-2.5 bg-[#1F1312] hover:bg-[#2F2322] text-white rounded-xl font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                <Download size={18} />
                Exportar CSV Completo
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl shadow-lg border border-[#E6E1CF] p-16 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1F1312] border-t-transparent mx-auto mb-4"></div>
            <p className="text-[#1F1312]/70 font-medium">Carregando relatórios...</p>
          </div>
        ) : data ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white border-2 border-[#E6E1CF] rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#1F1312]/70">
                    Total Vendido
                  </h3>
                  <div className="p-3 bg-[#E6E1CF] rounded-xl">
                    <DollarSign size={24} className="text-[#1F1312]" />
                  </div>
                </div>
                <p className="text-4xl font-bold text-[#1F1312] mb-1">
                  R$ {totalVendido.toFixed(2).replace('.', ',')}
                </p>
                <p className="text-sm text-[#1F1312]/60">Faturamento total</p>
              </div>

              <div className="bg-white border-2 border-[#E6E1CF] rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#1F1312]/70">
                    Número de Vendas
                  </h3>
                  <div className="p-3 bg-[#E6E1CF] rounded-xl">
                    <ShoppingCart size={24} className="text-[#1F1312]" />
                  </div>
                </div>
                <p className="text-4xl font-bold text-[#1F1312] mb-1">
                  {totalPedidos}
                </p>
                <p className="text-sm text-[#1F1312]/60">Pedidos realizados</p>
              </div>

              <div className="bg-white border-2 border-[#E6E1CF] rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#1F1312]/70">
                    Ticket Médio
                  </h3>
                  <div className="p-3 bg-[#E6E1CF] rounded-xl">
                    <TrendingUp size={24} className="text-[#1F1312]" />
                  </div>
                </div>
                <p className="text-4xl font-bold text-[#1F1312] mb-1">
                  R$ {ticketMedio.toFixed(2).replace('.', ',')}
                </p>
                <p className="text-sm text-[#1F1312]/60">Valor médio por venda</p>
              </div>

              {data.totalPorFormaPagamento.length > 0 && data.totalPorFormaPagamento.map((fp) => (
                <div
                  key={fp.formaPagamento}
                  className="bg-white border-2 border-[#E6E1CF] rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-[#1F1312]/70">
                      {fp.formaPagamento}
                    </h3>
                    <div className="p-3 bg-[#E6E1CF] rounded-xl">
                      {fp.formaPagamento.toLowerCase().includes('pix') || fp.formaPagamento.toLowerCase().includes('qr') ? (
                        <QrCode size={24} className="text-[#1F1312]" />
                      ) : fp.formaPagamento.toLowerCase().includes('dinheiro') || fp.formaPagamento.toLowerCase().includes('espécie') ? (
                        <Banknote size={24} className="text-[#1F1312]" />
                      ) : (
                        <CreditCard size={24} className="text-[#1F1312]" />
                      )}
                    </div>
                  </div>
                  <p className="text-4xl font-bold text-[#1F1312] mb-1">
                    R$ {fp.total.toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-sm text-[#1F1312]/60">Total recebido</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-[#E6E1CF] p-6 mb-8">
              <h2 className="text-xl font-bold text-[#1F1312] mb-6">Evolução de Vendas</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.totalVendidoPorDia}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6E1CF" />
                  <XAxis
                    dataKey="data"
                    stroke="#1F1312"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="#1F1312"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E6E1CF',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      color: '#1F1312'
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="totalVendido"
                    fill="#1F1312"
                    name="Total Vendido (R$)"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    dataKey="numPedidos"
                    fill="#8B7355"
                    name="Número de Pedidos"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-[#E6E1CF] p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#1F1312]">Relatório Completo por Produto</h2>
                <span className="px-4 py-1.5 bg-[#E6E1CF] text-[#1F1312] rounded-full text-sm font-semibold">
                  {data.todosProdutosPorId?.length || data.todosProdutosVendidos?.length || data.topProdutosQuantidade.length} produtos
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-[#E6E1CF] bg-[#E6E1CF]/30">
                      <th className="text-left py-4 px-4 font-bold text-[#1F1312] text-sm">ID</th>
                      <th className="text-left py-4 px-4 font-bold text-[#1F1312] text-sm">Produto</th>
                      <th className="text-right py-4 px-4 font-bold text-[#1F1312] text-sm">Qtd Vendida</th>
                      <th className="text-right py-4 px-4 font-bold text-[#1F1312] text-sm">Estoque</th>
                      <th className="text-right py-4 px-4 font-bold text-[#1F1312] text-sm">Preço Atual</th>
                      <th className="text-right py-4 px-4 font-bold text-[#1F1312] text-sm">Valor Unit. Médio</th>
                      <th className="text-right py-4 px-4 font-bold text-[#1F1312] text-sm">Total Faturado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.todosProdutosPorId || data.todosProdutosVendidos || data.topProdutosQuantidade)
                      .sort((a: any, b: any) => {
                        const quantA = a.quantidadeVendida || a.totalQuantidadeVendida || a.totalQuantidade || 0;
                        const quantB = b.quantidadeVendida || b.totalQuantidadeVendida || b.totalQuantidade || 0;
                        const fatA = a.totalFaturado || a.totalFaturamento || 0;
                        const fatB = b.totalFaturado || b.totalFaturamento || 0;

                        if (quantB !== quantA) {
                          return quantB - quantA;
                        }
                        return fatB - fatA;
                      })
                      .slice(0, 50)
                      .map((prod: any, index: number) => {
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
                            className={`border-b border-[#E6E1CF] hover:bg-[#E6E1CF]/20 transition-colors ${index < 3 ? 'bg-[#E6E1CF]/10' : ''
                              } ${quantidadeVendida === 0 ? 'opacity-50' : ''}`}
                          >
                            <td className="py-4 px-4 font-mono text-sm text-[#1F1312]/70">{prod.id}</td>
                            <td className="py-4 px-4 font-semibold text-[#1F1312]">{prod.nome}</td>
                            <td className={`text-right py-4 px-4 font-bold ${quantidadeVendida > 0 ? 'text-[#1F1312]' : 'text-[#1F1312]/40'
                              }`}>
                              {quantidadeVendida}
                            </td>
                            <td className={`text-right py-4 px-4 font-semibold ${estoqueDisponivel !== null
                              ? estoqueDisponivel === 0
                                ? 'text-red-600'
                                : estoqueDisponivel < 10
                                  ? 'text-yellow-600'
                                  : 'text-green-600'
                              : 'text-[#1F1312]/40'
                              }`}>
                              {estoqueDisponivel !== null ? estoqueDisponivel : 'N/A'}
                            </td>
                            <td className="text-right py-4 px-4 text-[#1F1312]/70 font-medium">
                              {precoAtual > 0 ? `R$ ${precoAtual.toFixed(2).replace('.', ',')}` : 'N/A'}
                            </td>
                            <td className="text-right py-4 px-4 text-[#1F1312]/70 font-medium">
                              {valorUnitarioMedio > 0 ? `R$ ${valorUnitarioMedio.toFixed(2).replace('.', ',')}` : '-'}
                            </td>
                            <td className={`text-right py-4 px-4 font-bold ${totalFaturado > 0 ? 'text-[#1F1312]' : 'text-[#1F1312]/40'
                              }`}>
                              {totalFaturado > 0 ? `R$ ${totalFaturado.toFixed(2).replace('.', ',')}` : '-'}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
                {(data.todosProdutosPorId?.length || data.todosProdutosVendidos?.length || 0) > 50 && (
                  <div className="mt-6 text-center text-sm text-[#1F1312]/60 bg-[#E6E1CF]/20 py-3 rounded-xl">
                    Mostrando 50 de {data.todosProdutosPorId?.length || data.todosProdutosVendidos?.length || 0} produtos.
                    Exporte o CSV para ver todos os produtos por ID.
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-[#E6E1CF] p-16 text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-[#1F1312]/70 text-lg font-medium">Selecione um filtro para visualizar os relatórios</p>
          </div>
        )}
      </div>
    </div>
  );
}