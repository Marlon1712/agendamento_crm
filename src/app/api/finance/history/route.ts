
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month'); // YYYY-MM
  
  try {
    let query = `
        SELECT l.id, l.appointment_date, l.name as client_name, p.name as procedure_name, l.price, l.status
        FROM leads l
        LEFT JOIN procedures p ON l.procedure_id = p.id
    `;
    
    const params = [];

    if (month) {
        query += ` WHERE DATE_FORMAT(l.appointment_date, '%Y-%m') = ?`;
        params.push(month);
    } else {
        // Default to this month? Or all time? Let's default limit 100 desc
        query += ` ORDER BY l.appointment_date DESC LIMIT 100`;
    }

    if (month) {
        query += ` ORDER BY l.appointment_date DESC`;
    }

    const [rows] = await pool.query(query, params);

    return NextResponse.json({ transactions: rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error fetching history' }, { status: 500 });
  }
}
