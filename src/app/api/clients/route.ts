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
            COALESCE(NULLIF(l.cpf, ''), CONCAT('N:', l.name, '|', l.contact)) as client_key,
            MAX(l.name) as name,
            MAX(l.contact) as contact,
            MAX(l.cpf) as cpf,
            MAX(l.appointment_date) as last_visit,
            MAX(cn.updated_at) as notes_updated_at,
            MAX(cn.notes) as notes
          FROM leads l
          LEFT JOIN client_notes cn
            ON (
              (cn.cpf IS NOT NULL AND cn.cpf != '' AND cn.cpf = l.cpf)
              OR
              ((cn.cpf IS NULL OR cn.cpf = '') AND cn.name = l.name AND cn.contact = l.contact)
            )
          WHERE l.name IS NOT NULL AND l.name != ''
          GROUP BY client_key
          ORDER BY name ASC
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
