import { NextResponse } from 'next/server';
import { getDbPool, getSqlServerVersion, getDbConfigInfo, formatErrorForResponse } from '@/lib/db';

export async function GET() {
  const config = getDbConfigInfo();
  const target = `${config.host}:${config.port}`;

  try {
    const pool = await getDbPool();
    const version = await getSqlServerVersion();

    return NextResponse.json({
      ok: true,
      target,
      database: config.database,
      serverVersion: version,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    // Log completo no terminal (já feito pelo formatMssqlError em db.ts)
    const formattedError = formatErrorForResponse(error);

    // Resposta estruturada para o client (sem stack trace)
    return NextResponse.json(
      {
        ok: false,
        target,
        database: config.database,
        error: {
          type: formattedError.type,
          message: formattedError.message,
          hint: formattedError.hint,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
