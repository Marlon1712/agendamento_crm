import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const today = new Date();
    const currentMonthStr = today.toISOString().split('T')[0].slice(0, 7); // YYYY-MM

    // 1. Top Services (All time or this month? Let's do All Time for better data density initially)
    const [topServices] = await pool.query(`
        SELECT p.name, COUNT(l.id) as count
        FROM leads l
        JOIN procedures p ON l.procedure_id = p.id
        WHERE l.status != 'cancelado'
        GROUP BY p.name
        ORDER BY count DESC
        LIMIT 3
    `);

    // 2. Cancellation Rate (This Month)
    const [cancellationStats] = await pool.query(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'cancelado' THEN 1 ELSE 0 END) as canceled
        FROM leads
        WHERE appointment_date LIKE ?
    `, [`${currentMonthStr}%`]);

    const totalAppts = (cancellationStats as any)[0].total || 0;
    const canceledAppts = (cancellationStats as any)[0].canceled || 0;
    const cancelRate = totalAppts > 0 ? (canceledAppts / totalAppts) * 100 : 0;

    // 3. Peak Hours (Heatmap style - All time data for better average)
    const [peakHours] = await pool.query(`
        SELECT 
            SUBSTRING(appointment_time, 1, 2) as hour,
            COUNT(*) as count
        FROM leads
        WHERE status != 'cancelado'
        GROUP BY hour
        ORDER BY count DESC
        LIMIT 3
    `);

    // 4. Basic Conversion (Realized vs Scheduled)
    const [conversionStats] = await pool.query(`
        SELECT 
            SUM(CASE WHEN status = 'realizado' THEN 1 ELSE 0 END) as realized,
            SUM(CASE WHEN status = 'agendado' THEN 1 ELSE 0 END) as scheduled
        FROM leads
        WHERE appointment_date LIKE ?
    `, [`${currentMonthStr}%`]);

    return NextResponse.json({
        top_services: topServices,
        cancellation_rate: Math.round(cancelRate),
        peak_hours: peakHours, // Array of { hour: '09', count: 10 }
        month_stats: {
            realized: (conversionStats as any)[0].realized || 0,
            scheduled: (conversionStats as any)[0].scheduled || 0,
            total: totalAppts
        }
    });

  } catch (error) {
    console.error('Analytics Error:', error);
    return NextResponse.json({ error: 'Erro ao gerar métricas' }, { status: 500 });
  }
}
