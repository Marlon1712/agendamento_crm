import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Fetch unique clients (name, contact) sorted by name
    // We group by name to avoid duplicates in the suggestion list
    // Ideally we should have a `clients` table, but for this MVP we extract from `leads`.
    const [rows] = await pool.query(`
        SELECT 
          l.name,
          l.contact,
          MAX(l.appointment_date) as last_visit,
          MAX(cn.updated_at) as notes_updated_at,
          MAX(cn.notes) as notes
        FROM leads l
        LEFT JOIN client_notes cn
          ON cn.name = l.name
          AND (cn.contact = l.contact OR (cn.contact IS NULL AND l.contact IS NULL))
        WHERE l.name IS NOT NULL AND l.name != ''
        GROUP BY l.name, l.contact
        ORDER BY l.name ASC
    `);
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Erro ao buscar clientes' }, { status: 500 });
  }
}
