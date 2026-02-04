import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { status, appointmentDate, appointmentTime, procedureId, price, name, contact } = body;
    const { id } = params;

    // 1. Full Update / Reschedule Mode (Requires Date & Time)
    if (appointmentDate && appointmentTime) {
        // Procedure Logic
        let targetProcedureId = procedureId || null;
        let duration = 30;
        
        // Get Duration (Updated Procedure or Existing)
        if (targetProcedureId) {
             const [procRows]: any = await pool.query('SELECT duration_minutes FROM procedures WHERE id = ?', [targetProcedureId]);
             if (procRows.length > 0) duration = procRows[0].duration_minutes;
        } else {
             const [procRows]: any = await pool.query('SELECT p.duration_minutes FROM leads l JOIN procedures p ON l.procedure_id = p.id WHERE l.id = ?', [id]);
             if (procRows.length > 0) duration = procRows[0].duration_minutes;
        }

        // Calculate End Time
        const [hours, minutes] = appointmentTime.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes + duration);
        const endTime = date.toTimeString().slice(0, 5);

        // Build Dynamic Update Query
        let query = 'UPDATE leads SET appointment_date = ?, appointment_time = ?, end_time = ?';
        let qParams: any[] = [appointmentDate, appointmentTime, endTime];

        if (status) {
            query += ', status = ?';
            qParams.push(status);
        } else {
            // Default to 'agendado' if rescheduling/editing valid slot, unless explicitly keeping 'pendente'? 
            // Usually editing implies confirming. We'll set to 'agendado' if not provided, or keep current?
            // Safer to set 'agendado' to ensure it appears in calendar properly.
            query += ', status = "agendado"';
        }

        if (targetProcedureId) {
            query += ', procedure_id = ?';
            qParams.push(targetProcedureId);
        }
        if (price !== undefined && price !== null && price !== '') {
            query += ', price = ?';
            qParams.push(price);
        }
        if (name) {
            query += ', name = ?';
            qParams.push(name);
        }
        if (contact) {
            query += ', contact = ?';
            qParams.push(contact);
        }

        query += ' WHERE id = ?';
        qParams.push(id);

        await pool.query(query, qParams);

        // SYNC: Update Google Calendar
        try {
            const { createCalendarEvent, updateCalendarEvent } = await import('@/lib/googleCalendar');
            // Fetch updated lead data
            const [leadRows]: any = await pool.query(`
                SELECT l.*, p.name as procedure_name 
                FROM leads l 
                JOIN procedures p ON l.procedure_id = p.id 
                WHERE l.id = ?
            `, [id]);
            
            if (leadRows.length > 0 && session.accessToken) {
                const lead = leadRows[0];
                if (lead.google_event_id) {
                    await updateCalendarEvent(session.accessToken, lead.google_event_id, lead);
                } else if (lead.status === 'agendado') {
                    // If no event yet (e.g. was pending), create it
                    const eventId = await createCalendarEvent(session.accessToken, lead);
                    if (eventId) {
                        await pool.query('UPDATE leads SET google_event_id = ? WHERE id = ?', [eventId, id]);
                    }
                }
            }
        } catch (e) {
            console.error('Sync Error (Edit):', e);
        }

        return NextResponse.json({ success: true });
    }

    // 2. Status Update Only (e.g. Drag & Drop, Confirm Button)
    if (status) {
        if (!['agendado', 'realizado', 'cancelado', 'pendente'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        // Validation: Cannot mark 'realizado' if future
        if (status === 'realizado') {
            const [leadRows]: any = await pool.query('SELECT appointment_date, appointment_time FROM leads WHERE id = ?', [id]);
            if (leadRows.length > 0) {
                 const lead = leadRows[0];
                 const dateStr = lead.appointment_date.toISOString().split('T')[0];
                 const [y, m, d] = dateStr.split('-').map(Number);
                 const [h, min] = lead.appointment_time.split(':').map(Number);
                 const apptDate = new Date(y, m - 1, d, h, min, 0);
                 if (apptDate > new Date()) {
                     return NextResponse.json({ error: 'Não é possível confirmar um agendamento futuro.' }, { status: 400 });
                 }
            }
        }

        await pool.query('UPDATE leads SET status = ? WHERE id = ?', [status, id]);

        // SYNC: Status Changes
        try {
            const { createCalendarEvent, updateCalendarEvent } = await import('@/lib/googleCalendar');
            const [leadRows]: any = await pool.query(`
                SELECT l.*, p.name as procedure_name 
                FROM leads l 
                JOIN procedures p ON l.procedure_id = p.id 
                WHERE l.id = ?
            `, [id]);

            if (leadRows.length > 0 && session.accessToken) {
                const lead = leadRows[0];
                if (status === 'agendado' && !lead.google_event_id) {
                     const eventId = await createCalendarEvent(session.accessToken, lead);
                     if (eventId) await pool.query('UPDATE leads SET google_event_id = ? WHERE id = ?', [eventId, id]);
                } else if (lead.google_event_id) {
                     await updateCalendarEvent(session.accessToken, lead.google_event_id, lead);
                }
            }
        } catch (e) { console.error('Sync Error (Status):', e); }

        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'No valid fields' }, { status: 400 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error updating lead' }, { status: 500 });
  }
}
