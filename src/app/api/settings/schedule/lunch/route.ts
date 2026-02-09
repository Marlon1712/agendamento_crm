import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { dayOfWeek, lunchStart, lunchEnd } = await request.json();
    if (dayOfWeek === undefined || !lunchStart || !lunchEnd) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const [updateRes]: any = await pool.query(
      'UPDATE schedule_rules SET lunch_start = ?, lunch_end = ? WHERE day_of_week = ?',
      [lunchStart, lunchEnd, dayOfWeek]
    );

    if (!updateRes || updateRes.affectedRows === 0) {
      await pool.query(
        'INSERT INTO schedule_rules (day_of_week, start_time, end_time, lunch_start, lunch_end, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        [dayOfWeek, '09:00', '18:00', lunchStart, lunchEnd, 1]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating lunch schedule:', error);
    return NextResponse.json({ error: 'Erro ao atualizar almoço' }, { status: 500 });
  }
}
