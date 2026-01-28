import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import sql from 'mssql';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';

    // Debounce server-side: se query muito curta, retornar vazio sem conectar
    if (query.trim().length > 0 && query.trim().length < 2) {
      return NextResponse.json({ products: [] });
    }

    const pool = await getDbPool();
    const requestDb = pool.request();

    let result: sql.IResult<any>;

    // NOTA: A tabela Produtos já está criada e preenchida no banco
    // Este endpoint APENAS CONSULTA (SELECT) - não faz INSERT/UPDATE/DELETE
    
    // Se query for um número (após trim), buscar por ID exato
    const trimmedQuery = query.trim();
    if (trimmedQuery && !isNaN(Number(trimmedQuery))) {
      requestDb.input('id', sql.Int, parseInt(trimmedQuery, 10));
      result = await requestDb.query(`
        SELECT Id, Nome, Preco, Estoque
        FROM Produtos
        WHERE Id = @id
      `);
    } else if (trimmedQuery) {
      // Buscar por nome (LIKE case-insensitive e accent-insensitive) - busca semântica
      // Usando COLLATE Latin1_General_CI_AI para ignorar acentos e maiúsculas/minúsculas
      // CI = Case Insensitive, AI = Accent Insensitive
      // O % permite buscar em qualquer parte do texto (início, meio ou fim)
      // Preservar espaços no meio da busca (apenas trim no início/fim)
      requestDb.input('nome', sql.VarChar(100), `%${trimmedQuery}%`);
      result = await requestDb.query(`
        SELECT Id, Nome, Preco, Estoque
        FROM Produtos
        WHERE Nome COLLATE Latin1_General_CI_AI LIKE @nome COLLATE Latin1_General_CI_AI
        ORDER BY Nome
      `);
    } else {
      // Sem query, retornar todos (limitado a 100)
      result = await requestDb.query(`
        SELECT TOP 100 Id, Nome, Preco, Estoque
        FROM Produtos
        ORDER BY Nome
      `);
    }

    const products = result.recordset.map((row: any) => ({
      id: row.Id,
      nome: row.Nome,
      preco: parseFloat(row.Preco),
      estoque: row.Estoque,
    }));

    return NextResponse.json({ products });
  } catch (error: any) {
    // Erro já foi logado formatado em db.ts (com rate limiting)
    return NextResponse.json(
      {
        error: 'Erro ao buscar produtos',
        message: 'Não foi possível conectar ao banco de dados. Verifique a configuração.',
      },
      { status: 500 }
    );
  }
}
