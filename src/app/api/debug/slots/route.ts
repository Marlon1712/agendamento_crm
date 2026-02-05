import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const [rules] = await pool.query('SELECT day_of_week, start_time, end_time, is_active FROM schedule_rules');
    const [procedures] = await pool.query('SELECT id, name, duration_minutes FROM procedures');
    
    return NextResponse.json({
        rules,
        procedures,
        now: new Date().toISOString(),
        env: {
            host: process.env.DB_HOST,
            db: process.env.DB_NAME
        }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
