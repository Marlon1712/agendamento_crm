import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT * FROM schedule_rules ORDER BY day_of_week ASC');
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar regras' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rules = await request.json(); // Array of { day_of_week, start_time, end_time, is_active }
    
    // Transactional update
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('DELETE FROM schedule_rules'); // Clear old rules (simple approach)
        
        for (const rule of rules) {
            await connection.query(
                'INSERT INTO schedule_rules (day_of_week, start_time, end_time, lunch_start, lunch_end, is_active) VALUES (?, ?, ?, ?, ?, ?)',
                [rule.day_of_week, rule.start_time, rule.end_time, rule.lunch_start || null, rule.lunch_end || null, rule.is_active]
            );
        }
        
        await connection.commit();
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao salvar regras' }, { status: 500 });
  }
}
