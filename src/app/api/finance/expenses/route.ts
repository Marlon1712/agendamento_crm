import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // YYYY-MM
    
    // Default to current month if not provided
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    // List realized expenses for this month
    const [expenses] = await pool.query(`
        SELECT * FROM expenses 
        WHERE date LIKE ? 
        ORDER BY date DESC
    `, [`${targetMonth}%`]);

    // Handle Recurring Projection (Simplified Logic)
    // 1. Get all recurring expenses
    const [recurringTemplates] = await pool.query(`
        SELECT * FROM expenses WHERE is_recurring = 1
    `);

    // 2. Identify which ones are missing for this target month
    // This is complex for SQL. For MVP, we just list expenses.
    // If user wants to *see* projections, we might need a separate query.
    // Let's stick to listing what is effectively in the DB for now.
    
    return NextResponse.json({ expenses });

  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar despesas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { description, amount, date, category, is_recurring, recurrence_day } = body;
        const user = (session as any).user;

        const [res] = await pool.query(`
            INSERT INTO expenses (description, amount, date, category, is_recurring, recurrence_day, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [description, amount, date, category, is_recurring ? 1 : 0, recurrence_day || null, user.id]);

        return NextResponse.json({ success: true, id: (res as any).insertId });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Erro ao criar despesa' }, { status: 500 });
    }
}
