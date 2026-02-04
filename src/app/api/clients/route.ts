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
        SELECT DISTINCT name, contact 
        FROM leads 
        WHERE name IS NOT NULL AND name != ''
        ORDER BY name ASC
    `);
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Erro ao buscar clientes' }, { status: 500 });
  }
}
