import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // @ts-ignore
    const [rows] = await pool.query('SELECT * FROM configuracoes');
    const settings: any = {};
    // @ts-ignore
    rows.forEach((r: any) => {
        settings[r.setting_key] = r.setting_value;
    });
    return NextResponse.json(settings);
  } catch (e) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    // keys: slot_duration, start_hour, end_hour, work_days
    
    // For database simplicity, we iterate and upsert
    for (const [key, value] of Object.entries(body)) {
        // @ts-ignore
        await pool.query(
            'INSERT INTO configuracoes (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
            [key, String(value), String(value)]
        );
    }
    
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Error saving settings' }, { status: 500 });
  }
}
