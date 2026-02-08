import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const contact = searchParams.get('contact') || '';
    const userId = searchParams.get('user_id');

    if (!name && !userId) return NextResponse.json({ error: 'Identificador obrigatório' }, { status: 400 });

    if (userId) {
      const [rows]: any = await pool.query(
        'SELECT notes, updated_at FROM client_notes WHERE user_id = ? LIMIT 1',
        [userId]
      );
      return NextResponse.json({ notes: rows?.[0]?.notes || '', updated_at: rows?.[0]?.updated_at || null });
    }

    const [rows]: any = await pool.query(
      'SELECT notes, updated_at FROM client_notes WHERE name = ? AND contact = ? LIMIT 1',
      [name, contact]
    );

    return NextResponse.json({ notes: rows?.[0]?.notes || '', updated_at: rows?.[0]?.updated_at || null });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao buscar notas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, contact, notes, user_id } = await request.json();
    if (!user_id && !name) return NextResponse.json({ error: 'Identificador obrigatório' }, { status: 400 });

    if (user_id) {
      await pool.query(
        `INSERT INTO client_notes (user_id, name, contact, notes)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE notes = VALUES(notes), name = VALUES(name), contact = VALUES(contact)`
      , [user_id, name || '', contact || '', notes || '']);
    } else {
      await pool.query(
        `INSERT INTO client_notes (name, contact, notes)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE notes = VALUES(notes)`
      , [name, contact || '', notes || '']);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao salvar notas' }, { status: 500 });
  }
}
