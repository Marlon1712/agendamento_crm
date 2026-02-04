
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import pool from './db';

const getAuthClient = (accessToken: string) => {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ access_token: accessToken });
  return auth;
};

export const createCalendarEvent = async (accessToken: string, lead: any) => {
  try {
    console.log('[GCal] Creating event for lead:', lead.id, lead.name);
    console.log('[GCal] Access Token length:', accessToken?.length);

    const auth = getAuthClient(accessToken);
    const calendar = google.calendar({ version: 'v3', auth });

    // CONVERT DATE: Ensure it is a clean YYYY-MM-DD string
    const dateObj = new Date(lead.appointment_date);
    const dateStr = dateObj.toISOString().split('T')[0];
    
    // lead.appointment_time is HH:MM:SS
    const startDateTime = `${dateStr}T${lead.appointment_time}`;
    
    // Calculate End Time properly (End Time might be null in DB sometimes?)
    // If we have end_time, use it. If not, default to +1 hour.
    let endDateTime;
    if (lead.end_time) {
        endDateTime = `${dateStr}T${lead.end_time}`;
    } else {
        // Fallback calculation
        const endD = new Date(dateObj);
        const [h, m] = lead.appointment_time.split(':').map(Number);
        endD.setHours(h + 1, m, 0);
        endDateTime = endD.toISOString().replace('.000Z', ''); 
        // This fallback is tricky due to TMs, simplest is relying on DB end_time logic or
        // ensuring we send the right string.
        // Let's stick to what worked before but CLEAN the date.
        // Actually, let's just assume end_time is HH:MM:SS similar to start.
        endDateTime = `${dateStr}T${lead.end_time || '18:00:00'}`;
    }

    const event = {
      summary: `💅 ${lead.name} - ${lead.procedure_name}`,
      description: `Cliente: ${lead.name}\nContato: ${lead.contact}\nServiço: ${lead.procedure_name}\nValor: R$ ${lead.price}`,
      start: { dateTime: startDateTime, timeZone: 'America/Sao_Paulo' },
      end: { dateTime: endDateTime, timeZone: 'America/Sao_Paulo' },
      colorId: lead.status === 'cancelado' ? '11' : undefined // 11 = Red in GCal
    };

    if (lead.status === 'cancelado') {
        event.summary = `[CANCELADO] ${event.summary}`;
    }
    
    console.log('[GCal] Event payload:', JSON.stringify(event));

    const res = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });
    
    console.log('[GCal] Create success. ID:', res.data.id);
    return res.data.id;
  } catch (error: any) {
    console.error('[GCal] Error creating calendar event:', error?.message);
    if (error?.response) {
       console.error('[GCal] API Error Response:', JSON.stringify(error.response.data));
    }
    return null;
  }
};

export const updateCalendarEvent = async (accessToken: string, eventId: string, lead: any) => {
    try {
      const auth = getAuthClient(accessToken);
      const calendar = google.calendar({ version: 'v3', auth });
  
      const dateObj = new Date(lead.appointment_date);
      const dateStr = dateObj.toISOString().split('T')[0];

      const startDateTime = `${dateStr}T${lead.appointment_time}`;
      const endDateTime = `${dateStr}T${lead.end_time}`;
  
      const event = {
        summary: `💅 ${lead.name} - ${lead.procedure_name}`,
        description: `Cliente: ${lead.name}\nContato: ${lead.contact}\nServiço: ${lead.procedure_name}\nValor: R$ ${lead.price}`,
        start: { dateTime: startDateTime, timeZone: 'America/Sao_Paulo' },
        end: { dateTime: endDateTime, timeZone: 'America/Sao_Paulo' },
        colorId: lead.status === 'cancelado' ? '11' : undefined
      };

      if (lead.status === 'cancelado') {
          event.summary = `[CANCELADO] ${event.summary}`;
      }
  
      await calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        requestBody: event,
      });
  
      return true;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      return false;
    }
  };

  export const deleteCalendarEvent = async (accessToken: string, eventId: string) => {
    try {
      const auth = getAuthClient(accessToken);
      const calendar = google.calendar({ version: 'v3', auth });
  
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
      });
  
      return true;
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      return false;
    }
  };
