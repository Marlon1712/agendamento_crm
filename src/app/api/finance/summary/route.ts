
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 1-12
    const currentYear = today.getFullYear();

    // 1. Total Realized (All time? Or this month? Let's do This Month for KPI)
    // Actually user asked for "Projected with Agenda and Consolidated (Realized)"
    // Let's give:
    // - Total Realized (This Month)
    // - Total Projected (This Month) -> 'agendado' + 'realizado' (if we consider realized as part of projection or just remaining? usually Projected = Realized + Future Booked)
    
    // KPI 1: Realizado Mês Atual
    const [realizedRows]: any = await pool.query(`
        SELECT SUM(price) as total 
        FROM leads 
        WHERE status = 'realizado' 
        AND MONTH(appointment_date) = ? AND YEAR(appointment_date) = ?
    `, [currentMonth, currentYear]);

    // KPI 2: Projetado Mês Atual (Agendado + Realizado)
    const [projectedRows]: any = await pool.query(`
        SELECT SUM(price) as total 
        FROM leads 
        WHERE status IN ('agendado', 'realizado') 
        AND MONTH(appointment_date) = ? AND YEAR(appointment_date) = ?
    `, [currentMonth, currentYear]);

    // KPI 3: Cancelado Mês Atual (Loss)
    const [canceledRows]: any = await pool.query(`
        SELECT SUM(price) as total 
        FROM leads 
        WHERE status = 'cancelado' 
        AND MONTH(appointment_date) = ? AND YEAR(appointment_date) = ?
    `, [currentMonth, currentYear]);

    // Chart Data: Last 6 months
    const [chartRows]: any = await pool.query(`
        SELECT 
            DATE_FORMAT(appointment_date, '%Y-%m') as month,
            SUM(CASE WHEN status = 'realizado' THEN price ELSE 0 END) as realized,
            SUM(CASE WHEN status IN ('agendado', 'realizado') THEN price ELSE 0 END) as projected
        FROM leads
        WHERE appointment_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY month
        ORDER BY month ASC
    `);

    return NextResponse.json({
        kpi: {
            realized: realizedRows[0].total || 0,
            projected: projectedRows[0].total || 0,
            canceled: canceledRows[0].total || 0
        },
        chart: chartRows
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error fetching finance summary' }, { status: 500 });
  }
}
