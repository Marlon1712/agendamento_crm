import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    // 1. Get Schedule Rules (to know which weekdays are closed)
    const [rules]: any = await pool.query('SELECT day_of_week, is_active FROM schedule_rules');
    
    // Map of closed DoW (0-6)
    // If is_active = 0 or missing, it's closed? 
    // Usually DB has 0-6 rows. Missing means closed? Or default open? 
    // Let's assume missing = closed if user didn't config. 
    // But usually we init DB with all days.
    const closedDays = rules
        .filter((r: any) => !r.is_active)
        .map((r: any) => r.day_of_week);

    // 2. Get Full Day Blocks
    // If we have month/year, we can filter.
    // blocked_slots might be partial day or full day. 
    // If start_time='00:00:00' and end_time='23:59:59' (or similar coverage of whole shift), it's full day.
    // For simplicity, let's just checking 'blocked_slots' table usually used for "Vacation" or "Holiday".
    // If the schema has start_time/end_time, we need to check if it covers the whole open time?
    // Too complex for checking every day. 
    // Let's check if there is a block that is "Full Day".
    // Or maybe we just return all blocks and frontend decides?
    
    // Let's refine the query if month/year provided
    let blockedQuery = 'SELECT blocked_date, start_time, end_time FROM blocked_slots';
    const params = [];
    if (month && year) {
        blockedQuery += ' WHERE MONTH(blocked_date) = ? AND YEAR(blocked_date) = ?';
        params.push(month, year);
    }
    
    const [blocks]: any = await pool.query(blockedQuery, params);
    
    // We also need to know the Open/Close times to determine if a block is "Full Day"
    // But simpler: If the user blocked "The Day", they probably blocked 00:00 to 23:59 usually?
    // Or maybe we treat ANY block in this table as "Day warning"? No, blocked_slots is for specific hours too.
    // However, for the Calendar View, we usually only grey out if the WHOLE day is gone.
    // Let's return the raw blocks and let frontend (or here) decide? 
    // Let's just return the dates that are FULLY blocked. 
    // Simplification: valid "Full Blocks" are those covering 8am-6pm or similar.
    
    // Let's just return the list of rules and blocks, and let the UI handle simple date matching?
    // Actually, to keep UI dumb, let's return `disabledDates` array for the specific month requested.
    
    // But generating that list requires iterating days. 
    // Let's return { closedDays: [0, 6], blockedDatestrings: ['2023-10-10'] }
    // We will assume a block in `blocked_slots` WITHOUT time or covering full day is what we want.
    // But the schema had start_time/end_time required.
    // Let's assume if the admin filtered a "Day Block", it fills the whole day.
    
    // Let's just return the data.
    return NextResponse.json({
        closedDays, // [0, 6] e.g. Sunday, Saturday
        blockedBlocks: blocks // Let frontend check if it matches date
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao buscar status do calendário' }, { status: 500 });
  }
}
