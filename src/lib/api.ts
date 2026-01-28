export interface Product {
  id: number;
  nome: string;
  preco: number;
  estoque: number;
}

export interface CartItem {
  produtoId: number;
  nome: string;
  preco: number;
  quantidade: number;
  estoqueAtual: number;
}

export interface SaleItem {
  produtoId: number;
  quantidade: number;
}

export interface SaleRequest {
  itens: SaleItem[];
  formaPagamento: 'PIX' | 'CARTAO' | 'DINHEIRO';
}

export interface SaleResponse {
  pedidoId: number;
  total: number;
  formaPagamento: string;
  itens: Array<{
    produtoId: number;
    nome: string;
    quantidade: number;
    precoUnitario: number;
    subtotal: number;
  }>;
}

export interface ReportData {
  periodo: {
    from: string | null;
    to: string | null;
  };
  totalVendidoPorDia: Array<{
    data: string;
    totalVendido: number;
    numPedidos: number;
  }>;
  totalPorFormaPagamento: Array<{
    formaPagamento: string;
    total: number;
  }>;
  topProdutosQuantidade: Array<{
    id: number;
    nome: string;
    totalQuantidade: number;
    totalFaturamento: number;
  }>;
  topProdutosFaturamento: Array<{
    id: number;
    nome: string;
    totalQuantidade: number;
    totalFaturamento: number;
  }>;
  todosProdutosVendidos: Array<{
    id: number;
    nome: string;
    estoqueAtual: number;
    precoAtual: number;
    totalQuantidadeVendida: number;
    totalFaturamento: number;
  }>;
  todosProdutosPorId: Array<{
    id: number;
    nome: string;
    estoqueDisponivel: number;
    precoAtual: number;
    quantidadeVendida: number;
    totalFaturado: number;
  }>;
}

/**
 * Busca produtos por query
 */
export async function fetchProducts(query: string): Promise<Product[]> {
  try {
    const url = query
      ? `/api/products?query=${encodeURIComponent(query)}`
      : '/api/products';
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar produtos: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    throw error;
  }
}

/**
 * Cria uma nova venda
 */
export async function createSale(payload: SaleRequest): Promise<SaleResponse> {
  try {
    const response = await fetch('/api/sales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Erro ao criar venda: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao criar venda:', error);
    throw error;
  }
}

/**
 * Busca relatórios
 */
export async function fetchReports(from?: string, to?: string): Promise<ReportData> {
  try {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    
    const url = `/api/reports?${params.toString()}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar relatórios: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar relatórios:', error);
    throw error;
  }
}

/**
 * Testa conexão com o backend
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch('/api/health');
    return response.ok;
  } catch (error) {
    return false;
  }
}
