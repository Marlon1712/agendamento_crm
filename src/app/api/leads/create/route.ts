import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { name, contact, date, time, procedure_id, status: providedStatus, price: customPrice } = await request.json();

    if (!name || !contact || !date || !time || !procedure_id) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // Check availability one last time (Race condition check)
    // For MVP we skip complex race condition lock, but generally good practice.
    
    // Calculate end_time based on procedure duration and price
    const [procRows]: any = await pool.query('SELECT duration_minutes, price, name, is_promotional, promo_price, promo_end_date, promo_start_date, promo_slots FROM procedures WHERE id = ?', [procedure_id]);
    if (procRows.length === 0) return NextResponse.json({ error: 'Procedimento inválido' }, { status: 400 });
    
    const proc = procRows[0];
    const duration = proc.duration_minutes;

    // Use Custom Price if provided (Admin Override)
    let price = customPrice !== undefined && customPrice !== null && customPrice !== '' ? parseFloat(customPrice) : proc.price;
    let isPromo = false;

    // Only calc promo if NO custom price was provided
    if ((customPrice === undefined || customPrice === null || customPrice === '') && proc.is_promotional && proc.promo_price) {
        // Construct Appointment Date Time to compare deeply
        // date is YYYY-MM-DD, time is HH:MM
        const appointmentDateTime = new Date(`${date}T${time}:00`);
        const endDate = proc.promo_end_date ? new Date(proc.promo_end_date) : null;
        const startDate = proc.promo_start_date ? new Date(proc.promo_start_date) : null;
        
        // 1. Check Date Range
        const isValidDate = (!endDate || endDate > appointmentDateTime) && (!startDate || startDate <= appointmentDateTime);
        
        // 2. Check Vacancy (if slots defined)
        let hasVacancy = true;
        if (proc.promo_slots) {
             const [countRows]: any = await pool.query(
                `SELECT COUNT(*) as used FROM leads 
                 WHERE procedure_id = ? 
                 AND status != 'cancelado' 
                 AND (created_at >= ? OR ? IS NULL)`,
                [proc.id, proc.promo_start_date, proc.promo_start_date]
             );
             const used = countRows[0]?.used || 0;
             if (used >= proc.promo_slots) {
                 hasVacancy = false;
                 console.log('[DEBUG] Promo Sold Out:', used, '/', proc.promo_slots);
             }
        }

        console.log('[DEBUG] Checking Promo vs Appointment:', {
            appointment: appointmentDateTime.toISOString(),
            promoEnd: endDate ? endDate.toISOString() : 'null',
            validDate: isValidDate,
            hasVacancy
        });

        // Check if appointment is BEFORE or EQUAL to end date AND has vacancy
        if (isValidDate && hasVacancy) {
            price = proc.promo_price;
            isPromo = true;
        }
    }
    
    console.log('[DEBUG] Final Price:', price, 'IsPromo:', isPromo);
    
    // Calculate End Time
    const [h, m] = time.split(':').map(Number);
    const dateObj = new Date();
    dateObj.setHours(h, m + duration, 0); // Add minutes
    const endTime = dateObj.toTimeString().slice(0, 5); // HH:MM

    // Determine Status
    // If request comes from Admin (we check session implicitly via providedStatus presence or strictly check session)
    // For simplicity, if `providedStatus` is present, we assume caller knows what they are doing. 
    // Ideally we should check session if status != 'pendente'.
    
    let status = 'pendente';
    let accessToken: string | null = null;
    let userId: number | null = null;

    // Check Session (for both Admin status override AND User Linking)
    const { getSession } = await import('@/lib/auth');
    const session: any = await getSession();
    
    if (session?.user) {
        userId = session.user.id;
        console.log('[API] Linked appointment to User ID:', userId);
    }

    if (providedStatus) {
         console.log('[API] Check Session for Manual Sync:', !!session);
         if (session) {
             status = providedStatus;
             accessToken = session.accessToken || null;
             console.log('[API] Access Token present:', !!accessToken);
         } else {
             console.warn('[API] No session found for manual booking override!');
         }
    }

    // Insert
    // Insert
    // Note: The unique key `unique_slot` might conflict if we rely on exact start time. 
    // Since we moved to dynamic time, we should probably RELAX the unique constraint or manage it differently.
    // For now, if we use dynamic starts (e.g. 09:15), the unique index on (date, time) only blocks EXACT duplicates.
    // Which is fine, because `slots/available` filters out overlaps.
    
    let insertId: any = 0;
    try {
        const [res]: any = await pool.query(
            'INSERT INTO leads (name, contact, appointment_date, appointment_time, end_time, procedure_id, price, status, is_promo, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, contact, date, time, endTime, procedure_id, price, status, isPromo, userId]
        );
        insertId = res.insertId;

        // If Admin created as 'agendado', Sync to Google Calendar immediately
        if (status === 'agendado' && accessToken) {
             const { createCalendarEvent } = await import('@/lib/googleCalendar');
             const lead = {
                 id: insertId,
                 name,
                 contact,
                 appointment_date: date,
                 appointment_time: time.length === 5 ? time + ':00' : time,
                 end_time: endTime.length === 5 ? endTime + ':00' : endTime,
                 procedure_name: procRows[0].name,
                 price,
                 status
             };
             
             try {
                const eventId = await createCalendarEvent(accessToken, lead);
                if (eventId) {
                     await pool.query('UPDATE leads SET google_event_id = ? WHERE id = ?', [eventId, insertId]);
                }
             } catch (syncError) {
                 console.error('Error syncing manual creation:', syncError);
             }
        }

    } catch (dbError: any) {
        if (dbError.code === 'ER_DUP_ENTRY') {
             return NextResponse.json({ error: 'Horário indisponível (concorrência)' }, { status: 409 });
        }
        throw dbError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json({ error: 'Erro ao criar agendamento' }, { status: 500 });
  }
}
