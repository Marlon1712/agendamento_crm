import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const contact = searchParams.get('contact') || '';
    const cpf = searchParams.get('cpf') || '';
    const userId = searchParams.get('user_id');

    if (!name && !userId && !cpf) return NextResponse.json({ error: 'Identificador obrigatório' }, { status: 400 });

    if (userId) {
      const [rows]: any = await pool.query(
        'SELECT notes, updated_at, cpf FROM client_notes WHERE user_id = ? LIMIT 1',
        [userId]
      );
      let cpfValue = rows?.[0]?.cpf || '';
      if (!cpfValue) {
        const [leadRows]: any = await pool.query(
          'SELECT cpf FROM leads WHERE user_id = ? AND cpf IS NOT NULL AND cpf != "" ORDER BY appointment_date DESC LIMIT 1',
          [userId]
        );
        cpfValue = leadRows?.[0]?.cpf || '';
        if (cpfValue) {
          await pool.query(
            'UPDATE client_notes SET cpf = ? WHERE user_id = ?',
            [cpfValue, userId]
          );
        }
      }
      return NextResponse.json({ notes: rows?.[0]?.notes || '', updated_at: rows?.[0]?.updated_at || null, cpf: cpfValue });
    }

    try {
      if (cpf) {
        const [rows]: any = await pool.query(
          'SELECT notes, updated_at, cpf FROM client_notes WHERE cpf = ? LIMIT 1',
          [cpf]
        );
        if (rows?.[0]) {
          return NextResponse.json({ notes: rows[0].notes || '', updated_at: rows[0].updated_at || null, cpf: rows[0].cpf || cpf });
        }
      }
      const [rows]: any = await pool.query(
        'SELECT notes, updated_at, cpf FROM client_notes WHERE name = ? AND contact = ? LIMIT 1',
        [name, contact]
      );
      let cpfValue = rows?.[0]?.cpf || '';
      if (!cpfValue) {
        const [leadRows]: any = await pool.query(
          'SELECT cpf FROM leads WHERE name = ? AND contact = ? AND cpf IS NOT NULL AND cpf != "" ORDER BY appointment_date DESC LIMIT 1',
          [name, contact]
        );
        cpfValue = leadRows?.[0]?.cpf || '';
        if (cpfValue && rows?.[0]) {
          await pool.query(
            'UPDATE client_notes SET cpf = ? WHERE name = ? AND contact = ?',
            [cpfValue, name, contact]
          );
        }
      }
      return NextResponse.json({ notes: rows?.[0]?.notes || '', updated_at: rows?.[0]?.updated_at || null, cpf: cpfValue });
    } catch (innerError) {
      console.warn('Fallback client_notes query (contact):', innerError);
      if (cpf) {
        try {
          const [rows]: any = await pool.query(
            'SELECT notes, updated_at, cpf FROM client_notes WHERE cpf = ? LIMIT 1',
            [cpf]
          );
          return NextResponse.json({ notes: rows?.[0]?.notes || '', updated_at: rows?.[0]?.updated_at || null, cpf: rows?.[0]?.cpf || cpf });
        } catch {}
      }
      const [rows]: any = await pool.query(
        'SELECT notes, updated_at, cpf FROM client_notes WHERE name = ? LIMIT 1',
        [name]
      );
      let cpfValue = rows?.[0]?.cpf || '';
      if (!cpfValue) {
        const [leadRows]: any = await pool.query(
          'SELECT cpf FROM leads WHERE name = ? AND cpf IS NOT NULL AND cpf != "" ORDER BY appointment_date DESC LIMIT 1',
          [name]
        );
        cpfValue = leadRows?.[0]?.cpf || '';
        if (cpfValue && rows?.[0]) {
          await pool.query(
            'UPDATE client_notes SET cpf = ? WHERE name = ?',
            [cpfValue, name]
          );
        }
      }
      return NextResponse.json({ notes: rows?.[0]?.notes || '', updated_at: rows?.[0]?.updated_at || null, cpf: cpfValue });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao buscar notas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, contact, notes, user_id, cpf } = await request.json();
    if (!user_id && !name) return NextResponse.json({ error: 'Identificador obrigatório' }, { status: 400 });
    let cpfValue = cpf || '';
    if (!cpfValue) {
      if (user_id) {
        const [leadRows]: any = await pool.query(
          'SELECT cpf FROM leads WHERE user_id = ? AND cpf IS NOT NULL AND cpf != "" ORDER BY appointment_date DESC LIMIT 1',
          [user_id]
        );
        cpfValue = leadRows?.[0]?.cpf || '';
      } else if (name) {
        const [leadRows]: any = await pool.query(
          'SELECT cpf FROM leads WHERE name = ? AND contact = ? AND cpf IS NOT NULL AND cpf != "" ORDER BY appointment_date DESC LIMIT 1',
          [name, contact || '']
        );
        cpfValue = leadRows?.[0]?.cpf || '';
      }
    }

    if (user_id) {
      await pool.query(
        `INSERT INTO client_notes (user_id, name, contact, cpf, notes)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE notes = VALUES(notes), name = VALUES(name), contact = VALUES(contact), cpf = VALUES(cpf)`
      , [user_id, name || '', contact || '', cpfValue || null, notes || '']);
    } else {
      try {
        await pool.query(
          `INSERT INTO client_notes (name, contact, cpf, notes)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE notes = VALUES(notes), cpf = VALUES(cpf)`
        , [name, contact || '', cpfValue || null, notes || '']);
      } catch (innerError) {
        console.warn('Fallback client_notes insert (no contact):', innerError);
        await pool.query(
          `INSERT INTO client_notes (name, cpf, notes)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE notes = VALUES(notes), cpf = VALUES(cpf)`
        , [name, cpfValue || null, notes || '']);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao salvar notas' }, { status: 500 });
  }
}
