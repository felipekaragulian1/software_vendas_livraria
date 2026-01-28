import { NextRequest, NextResponse } from 'next/server';
import { getDbPool, discoverPedidosSchema } from '@/lib/db';
import sql from 'mssql';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const pool = await getDbPool();
    const pedidosSchema = await discoverPedidosSchema();

    // Determinar coluna de data
    const dataColumn = pedidosSchema.dataHoraColumn || 'DataHora';

    // Construir filtro de data
    let dateFilter = '';
    if (from || to) {
      const conditions: string[] = [];
      if (from) {
        conditions.push(`CAST(${dataColumn} AS DATE) >= @from`);
      }
      if (to) {
        conditions.push(`CAST(${dataColumn} AS DATE) <= @to`);
      }
      dateFilter = `WHERE ${conditions.join(' AND ')}`;
    }

    const reportRequest = pool.request();
    if (from) {
      reportRequest.input('from', sql.Date, new Date(from));
    }
    if (to) {
      reportRequest.input('to', sql.Date, new Date(to));
    }

    // 1. Total vendido por dia/período
    const totalVendidoQuery = `
      SELECT 
        CAST(${dataColumn} AS DATE) AS Data,
        SUM(pi.Quantidade * pi.PrecoUnitario) AS TotalVendido,
        COUNT(DISTINCT p.Id) AS NumPedidos
      FROM Pedidos p
      INNER JOIN PedidoItens pi ON p.Id = pi.PedidoId
      ${dateFilter}
      GROUP BY CAST(${dataColumn} AS DATE)
      ORDER BY Data DESC
    `;

    const totalVendidoResult = await reportRequest.query(totalVendidoQuery);

    // 2. Total por forma de pagamento
    let totalPorFormaPagamentoQuery = '';
    if (pedidosSchema.hasFormaPagamento) {
      const formaPagamentoColumn = pedidosSchema.formaPagamentoColumn || 'FormaPagamento';
      totalPorFormaPagamentoQuery = `
        SELECT 
          p.${formaPagamentoColumn} AS FormaPagamento,
          SUM(pi.Quantidade * pi.PrecoUnitario) AS Total
        FROM Pedidos p
        INNER JOIN PedidoItens pi ON p.Id = pi.PedidoId
        ${dateFilter}
        GROUP BY p.${formaPagamentoColumn}
        ORDER BY Total DESC
      `;
    } else {
      // Tentar buscar de PedidoItens se existir lá
      const pedidoItensRequest = pool.request();
      if (from) {
        pedidoItensRequest.input('from', sql.Date, new Date(from));
      }
      if (to) {
        pedidoItensRequest.input('to', sql.Date, new Date(to));
      }

      totalPorFormaPagamentoQuery = `
        SELECT 
          pi.FormaPagamento,
          SUM(pi.Quantidade * pi.PrecoUnitario) AS Total
        FROM Pedidos p
        INNER JOIN PedidoItens pi ON p.Id = pi.PedidoId
        ${dateFilter}
        GROUP BY pi.FormaPagamento
        ORDER BY Total DESC
      `;
    }

    const totalPorFormaPagamentoResult = await reportRequest.query(totalPorFormaPagamentoQuery);

    // 3. Top produtos por quantidade
    const topProdutosQuantidadeQuery = `
      SELECT TOP 10
        pr.Id,
        pr.Nome,
        SUM(pi.Quantidade) AS TotalQuantidade,
        SUM(pi.Quantidade * pi.PrecoUnitario) AS TotalFaturamento
      FROM PedidoItens pi
      INNER JOIN Produtos pr ON pi.ProdutoId = pr.Id
      INNER JOIN Pedidos p ON pi.PedidoId = p.Id
      ${dateFilter}
      GROUP BY pr.Id, pr.Nome
      ORDER BY TotalQuantidade DESC
    `;

    const topProdutosQuantidadeResult = await reportRequest.query(topProdutosQuantidadeQuery);

    // 4. Top produtos por faturamento
    const topProdutosFaturamentoQuery = `
      SELECT TOP 10
        pr.Id,
        pr.Nome,
        SUM(pi.Quantidade) AS TotalQuantidade,
        SUM(pi.Quantidade * pi.PrecoUnitario) AS TotalFaturamento
      FROM PedidoItens pi
      INNER JOIN Produtos pr ON pi.ProdutoId = pr.Id
      INNER JOIN Pedidos p ON pi.PedidoId = p.Id
      ${dateFilter}
      GROUP BY pr.Id, pr.Nome
      ORDER BY TotalFaturamento DESC
    `;

    const topProdutosFaturamentoResult = await reportRequest.query(topProdutosFaturamentoQuery);

    // 5. TODOS os produtos vendidos (não apenas top 10) com estoque atual
    const todosProdutosVendidosRequest = pool.request();
    if (from) {
      todosProdutosVendidosRequest.input('from', sql.Date, new Date(from));
    }
    if (to) {
      todosProdutosVendidosRequest.input('to', sql.Date, new Date(to));
    }

    const todosProdutosVendidosQuery = `
      SELECT 
        pr.Id,
        pr.Nome,
        pr.Estoque AS EstoqueAtual,
        pr.Preco AS PrecoAtual,
        SUM(pi.Quantidade) AS TotalQuantidadeVendida,
        SUM(pi.Quantidade * pi.PrecoUnitario) AS TotalFaturamento
      FROM PedidoItens pi
      INNER JOIN Produtos pr ON pi.ProdutoId = pr.Id
      INNER JOIN Pedidos p ON pi.PedidoId = p.Id
      ${dateFilter}
      GROUP BY pr.Id, pr.Nome, pr.Estoque, pr.Preco
      ORDER BY TotalQuantidadeVendida DESC
    `;

    const todosProdutosVendidosResult = await todosProdutosVendidosRequest.query(todosProdutosVendidosQuery);

    // 6. TODOS os produtos (por ID) com quantidade vendida e estoque disponível
    // LEFT JOIN para incluir produtos que não foram vendidos (quantidade = 0)
    const todosProdutosRequest = pool.request();
    if (from) {
      todosProdutosRequest.input('from', sql.Date, new Date(from));
    }
    if (to) {
      todosProdutosRequest.input('to', sql.Date, new Date(to));
    }

    // Construir filtro de data para o LEFT JOIN (aplicar apenas nas vendas)
    let dateFilterLeftJoin = '';
    if (from || to) {
      const conditions: string[] = [];
      if (from) {
        conditions.push(`CAST(p.${dataColumn} AS DATE) >= @from`);
      }
      if (to) {
        conditions.push(`CAST(p.${dataColumn} AS DATE) <= @to`);
      }
      dateFilterLeftJoin = `AND ${conditions.join(' AND ')}`;
    }

    // Query usando LEFT JOIN com filtro de data aplicado apenas nas vendas
    const todosProdutosQuery = `
      SELECT 
        pr.Id,
        pr.Nome,
        pr.Estoque AS EstoqueDisponivel,
        pr.Preco AS PrecoAtual,
        ISNULL(SUM(pi.Quantidade), 0) AS QuantidadeVendida,
        ISNULL(SUM(pi.Quantidade * pi.PrecoUnitario), 0) AS TotalFaturado
      FROM Produtos pr
      LEFT JOIN (
        SELECT 
          pi.ProdutoId,
          pi.Quantidade,
          pi.PrecoUnitario,
          pi.PedidoId
        FROM PedidoItens pi
        INNER JOIN Pedidos p ON pi.PedidoId = p.Id
        ${dateFilter}
      ) pi ON pr.Id = pi.ProdutoId
      GROUP BY pr.Id, pr.Nome, pr.Estoque, pr.Preco
      ORDER BY pr.Id
    `;

    const todosProdutosResult = await todosProdutosRequest.query(todosProdutosQuery);

    return NextResponse.json({
      periodo: {
        from: from || null,
        to: to || null,
      },
      totalVendidoPorDia: totalVendidoResult.recordset.map((row: any) => ({
        data: row.Data,
        totalVendido: parseFloat(row.TotalVendido || 0),
        numPedidos: row.NumPedidos,
      })),
      totalPorFormaPagamento: totalPorFormaPagamentoResult.recordset.map((row: any) => ({
        formaPagamento: row.FormaPagamento,
        total: parseFloat(row.Total || 0),
      })),
      topProdutosQuantidade: topProdutosQuantidadeResult.recordset.map((row: any) => ({
        id: row.Id,
        nome: row.Nome,
        totalQuantidade: row.TotalQuantidade,
        totalFaturamento: parseFloat(row.TotalFaturamento || 0),
      })),
      topProdutosFaturamento: topProdutosFaturamentoResult.recordset.map((row: any) => ({
        id: row.Id,
        nome: row.Nome,
        totalQuantidade: row.TotalQuantidade,
        totalFaturamento: parseFloat(row.TotalFaturamento || 0),
      })),
      todosProdutosVendidos: todosProdutosVendidosResult.recordset.map((row: any) => ({
        id: row.Id,
        nome: row.Nome,
        estoqueAtual: row.EstoqueAtual,
        precoAtual: parseFloat(row.PrecoAtual || 0),
        totalQuantidadeVendida: row.TotalQuantidadeVendida,
        totalFaturamento: parseFloat(row.TotalFaturamento || 0),
      })),
      todosProdutosPorId: todosProdutosResult.recordset.map((row: any) => ({
        id: row.Id,
        nome: row.Nome,
        estoqueDisponivel: row.EstoqueDisponivel,
        precoAtual: parseFloat(row.PrecoAtual || 0),
        quantidadeVendida: row.QuantidadeVendida,
        totalFaturado: parseFloat(row.TotalFaturado || 0),
      })),
    });
  } catch (error: any) {
    console.error('❌ Erro ao gerar relatório:', error);
    return NextResponse.json(
      {
        error: 'Erro ao gerar relatório',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
