import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const [rows]: any = await pool.query(
      "SELECT setting_value FROM configuracoes WHERE setting_key = 'slot_interval' LIMIT 1"
    );
    return NextResponse.json({ value: rows?.[0]?.setting_value || '15' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ value: '15' }, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { value } = await request.json();
    const safeValue = String(value ?? '15');

    await pool.query(
      `INSERT INTO configuracoes (setting_key, setting_value)
       VALUES ('slot_interval', ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`
    , [safeValue]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 });
  }
}
