import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
     const { searchParams } = new URL(request.url);
     const date = searchParams.get('date');

     let query = 'SELECT * FROM blocked_slots ORDER BY blocked_date, start_time ASC';
     const params = [];

     if (date) {
        query = 'SELECT * FROM blocked_slots WHERE blocked_date = ? ORDER BY start_time ASC';
        params.push(date);
     }

     const [rows] = await pool.query(query, params);
     return NextResponse.json(rows);
  } catch (error) {
     return NextResponse.json({ error: 'Erro ao buscar bloqueios' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { date, startTime, endTime, reason, recurrence, recurrenceEnd } = await request.json();
    
    // Validate
    if (!date || !startTime || !endTime) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const blocksToInsert = [];
    const startDate = new Date(date + 'T00:00:00'); // Force local start day
    const endDate = recurrenceEnd ? new Date(recurrenceEnd + 'T00:00:00') : startDate;

    // Safety limit: 366 days max to prevent infinite loops
    const MAX_DAYS = 366;
    let count = 0;

    let current = new Date(startDate);

    while (current <= endDate && count < MAX_DAYS) {
        const year = current.getFullYear();
        const month = (current.getMonth() + 1).toString().padStart(2, '0');
        const day = current.getDate().toString().padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        blocksToInsert.push([dateStr, startTime, endTime, reason]);

        // Increment
        if (recurrence === 'daily') {
            current.setDate(current.getDate() + 1);
        } else if (recurrence === 'weekly') {
            current.setDate(current.getDate() + 7);
        } else {
            break; // No recurrence, stop after first
        }
        count++;
    }
    
    // Bulk Insert (or loop queries if bulk syntax tricky with library)
    // MySQL supports: VALUES ? with nested array for bulk? 
    // pool.query usually supports `?` as `[[v1,v2], [v1,v2]]`
    
    if (blocksToInsert.length > 0) {
        await pool.query(
            'INSERT INTO blocked_slots (blocked_date, start_time, end_time, reason) VALUES ?',
            [blocksToInsert]
        );
    }
    
    return NextResponse.json({ success: true, count: blocksToInsert.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao bloquear horário' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await pool.query('DELETE FROM blocked_slots WHERE id = ?', [id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao desbloquear' }, { status: 500 });
    }
}
