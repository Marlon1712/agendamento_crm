import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  // Protect Route
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    // Simple list for MVP. 
    // Ideally user wants day/week view. We can return all or filter by date range query params.
    // For "Listar: horário, nome, contato, status", filtering by date is key.
    
    // Default: return all future appointments or last 100?
    // Let's support date filter.
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const userIdParam = searchParams.get('user_id');

    let query = `
        SELECT l.*, p.name as procedure_name, p.price as procedure_price, p.duration_minutes as procedure_duration
        FROM leads l
        LEFT JOIN procedures p ON l.procedure_id = p.id
    `;
    const params = [];
    let whereClauses = [];

    // Role Based Filtering
    const user = (session as any).user;
    if (user.role === 'client') {
        whereClauses.push('l.user_id = ?');
        params.push(user.id);
    } else if (userIdParam) {
        // Admin filtering by specific user
        whereClauses.push('l.user_id = ?');
        params.push(userIdParam);
    }
    
    if (date) {
        whereClauses.push('l.appointment_date = ?');
        params.push(date);
    }
    
    if (whereClauses.length > 0) {
        query += ' WHERE ' + whereClauses.join(' AND ');
    }
    
    query += ' ORDER BY l.appointment_date DESC, l.appointment_time ASC';

    // @ts-ignore
    const [rows] = await pool.query(query, params);

    return NextResponse.json({ leads: rows });

  } catch (error) {
    console.error('List leads error:', error);
    return NextResponse.json({ error: 'Erro ao buscar leads' }, { status: 500 });
  }
}
