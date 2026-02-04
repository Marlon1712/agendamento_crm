import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
     const { id } = params;
     
     // Google Sync: Try to delete event if exists
     try {
        const { deleteCalendarEvent } = await import('@/lib/googleCalendar');
        const [rows]: any = await pool.query('SELECT google_event_id FROM leads WHERE id = ?', [id]);
        if (rows.length > 0 && rows[0].google_event_id && session.accessToken) {
            console.log('[API] Deleting GCal Event:', rows[0].google_event_id);
            await deleteCalendarEvent(session.accessToken, rows[0].google_event_id);
        } else {
            console.log('[API] No GCal Event to delete for lead:', id);
        }
     } catch (e) {
         console.error("Error deleting from Google Calendar during lead delete:", e);
         // Continue to delete from DB even if sync fails
     }

     await pool.query('DELETE FROM leads WHERE id = ?', [id]);
     return NextResponse.json({ success: true });
  } catch (error) {
     console.error(error);
     return NextResponse.json({ error: 'Error deleting lead' }, { status: 500 });
  }
}
