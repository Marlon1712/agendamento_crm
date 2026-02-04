import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // Fetch active promotions that have a slot limit defined
    const [rows]: any = await pool.query(`
      SELECT 
        p.id, 
        p.promo_slots,
        (
            SELECT COUNT(*) 
            FROM leads l 
            WHERE l.procedure_id = p.id 
              AND l.status != 'cancelado' 
              AND (p.promo_start_date IS NULL OR l.created_at >= p.promo_start_date)
              AND (p.promo_end_date IS NULL OR l.appointment_date <= p.promo_end_date)
        ) as used_slots
      FROM procedures p
      WHERE p.is_promotional = 1 
        AND p.promo_slots IS NOT NULL
        AND (p.promo_end_date IS NULL OR p.promo_end_date >= CURRENT_DATE)
    `);

    const availabilityMap: Record<number, number> = {};

    rows.forEach((row: any) => {
        const remaining = Math.max(0, row.promo_slots - row.used_slots);
        availabilityMap[row.id] = remaining;
    });

    return NextResponse.json(availabilityMap);

  } catch (error) {
    console.error(error);
    return NextResponse.json({}, { status: 500 });
  }
}
