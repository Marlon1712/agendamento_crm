import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    try {
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
    } catch (innerError) {
      // Fallback in case client_notes table is missing or schema is outdated
      console.warn('Fallback clients query:', innerError);
      const [rows] = await pool.query(`
          SELECT 
            name,
            contact,
            MAX(appointment_date) as last_visit
          FROM leads
          WHERE name IS NOT NULL AND name != ''
          GROUP BY name, contact
          ORDER BY name ASC
      `);
      return NextResponse.json(rows);
    }
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Erro ao buscar clientes' }, { status: 500 });
  }
}
