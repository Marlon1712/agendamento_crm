import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { order } = await request.json(); // Array of IDs in order: [3, 1, 2...]

    if (!Array.isArray(order)) {
        return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // Transactional update
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        for (let i = 0; i < order.length; i++) {
            await connection.query(
                'UPDATE procedures SET display_order = ? WHERE id = ?',
                [i, order[i]]
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
    return NextResponse.json({ error: 'Erro ao reordenar' }, { status: 500 });
  }
}
