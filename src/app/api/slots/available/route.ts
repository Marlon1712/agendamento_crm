import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get('date'); // YYYY-MM-DD
  const procedureId = searchParams.get('procedureId');

  if (!dateStr || !procedureId) {
    return NextResponse.json({ error: 'Data e Procedimento obrigatórios' }, { status: 400 });
  }

  try {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay(); // 0-6

    // 1. Get Duration
    const [procRows]: any = await pool.query('SELECT duration_minutes FROM procedures WHERE id = ?', [procedureId]);
    if (procRows.length === 0) return NextResponse.json({ error: 'Procedimento não encontrado' }, { status: 404 });
    const duration = procRows[0].duration_minutes;

    // 2. Get Rules for this Day
    const [ruleRows]: any = await pool.query(
        'SELECT start_time, end_time, lunch_start, lunch_end, is_active FROM schedule_rules WHERE day_of_week = ?', 
        [dayOfWeek]
    );

    // If day is closed, we still might want to return the slots but marked as unavailable?
    if (ruleRows.length === 0 || !ruleRows[0].is_active) {
        return NextResponse.json({ 
            slots: [], 
            reason: 'CLOSED_DAY',
            message: 'Não há expediente neste dia.' 
        });
    }

    const openTime = ruleRows[0].start_time; // '09:00:00'
    const closeTime = ruleRows[0].end_time;  // '18:00:00'
    const lunchStart = ruleRows[0].lunch_start;
    const lunchEnd = ruleRows[0].lunch_end;

    // 3. Get Busy Slots
    let leadsQuery = `SELECT appointment_time, end_time FROM leads WHERE appointment_date = ? AND status != 'cancelado'`;
    const leadsParams: any[] = [dateStr];
    const excludeLeadId = searchParams.get('excludeLeadId');
    if (excludeLeadId) {
        leadsQuery += ' AND id != ?';
        leadsParams.push(excludeLeadId);
    }
    const [leads]: any = await pool.query(leadsQuery, leadsParams);

    const [blocks]: any = await pool.query(
        'SELECT id, start_time, end_time, reason FROM blocked_slots WHERE blocked_date = ?',
        [dateStr]
    );
    const manualBlocks = blocks.filter((b: any) => b.reason !== 'override' && b.reason !== 'available');
    const overrides = blocks.filter((b: any) => b.reason === 'override');
    const availableOverrides = blocks.filter((b: any) => b.reason === 'available');

    // Helpers
    const toMinutes = (timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    };
    const formatTime = (mins: number) => {
        const h = Math.floor(mins / 60).toString().padStart(2, '0');
        const m = (mins % 60).toString().padStart(2, '0');
        return `${h}:${m}`;
    };

    const startMin = toMinutes(openTime);
    const endMin = toMinutes(closeTime);
    const lunchStartMin = lunchStart ? toMinutes(lunchStart) : -1;
    const lunchEndMin = lunchEnd ? toMinutes(lunchEnd) : -1;
    
    // Current time for "past" validation
    const now = new Date();
    // Adjust to BRT/User timezone if needed, but assuming server local time for now or standard UTC handling logic app-wide.
    // Ideally we rely on the date string comparison.
    // If dateStr is "today", we filter past slots.
    const todayStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD local
    const isToday = dateStr === todayStr;
    const currentMinutes = isToday ? (now.getHours() * 60 + now.getMinutes()) : -1;

    const step = 30; // 30 min grid
    const allSlots = [];
    
    // We scan the WHOLE day to generate the grid
    for (let current = startMin; current < endMin; current += step) {
        const slotStart = current;
        // The slot is valid for booking if (start + duration) <= end
        const slotEnd = current + duration;
        
        let status = 'available';
        let unavailableReason = '';

        // 1. End of Day check (fit duration)
        if (slotEnd > endMin) {
             status = 'unavailable';
             unavailableReason = 'closed'; // or "too_short"
        }

        // 2. Past check
        if (status === 'available' && isToday && slotStart < currentMinutes) {
            status = 'unavailable';
            unavailableReason = 'past';
        }

        // 3. Lunch check (unless overridden)
        if (status === 'available' && lunchStartMin !== -1) {
            // Check overlap: (StartA < EndB) and (EndA > StartB)
            // If the SERVICE overlaps lunch
            const hasOverride = overrides.some((ov: any) => {
                const bStart = toMinutes(ov.start_time);
                const bEnd = ov.end_time ? toMinutes(ov.end_time) : bStart + 60;
                return (slotStart < bEnd) && (slotEnd > bStart);
            });
            if (!hasOverride && slotStart < lunchEndMin && slotEnd > lunchStartMin) {
                 status = 'unavailable';
                 unavailableReason = 'lunch';
            }
        }

        // 4. Busy check (Leads)
        if (status === 'available') {
            const isBusy = leads.some((busy: any) => {
                const bStart = toMinutes(busy.appointment_time);
                const bEnd = busy.end_time ? toMinutes(busy.end_time) : bStart + 60;
                return (slotStart < bEnd) && (slotEnd > bStart);
            });
            if (isBusy) {
                status = 'unavailable';
                unavailableReason = 'busy';
            }
        }

        // 5. Manual block check (Blocked Slots)
        let blockReason: string | null = null;
        let blockId: number | null = null;
        if (status === 'available') {
            const block = manualBlocks.find((busy: any) => {
                const bStart = toMinutes(busy.start_time);
                const bEnd = busy.end_time ? toMinutes(busy.end_time) : bStart + 60;
                return (slotStart < bEnd) && (slotEnd > bStart);
            });
            if (block) {
                status = 'unavailable';
                unavailableReason = 'blocked';
                blockReason = block.reason || 'Bloqueado';
                blockId = block.id || null;
            }
        }

        // 6. Available override (only flips lunch/blocked)
        let availableOverrideId: number | null = null;
        if (status === 'unavailable' && (unavailableReason === 'lunch' || unavailableReason === 'blocked')) {
            const ov = availableOverrides.find((o: any) => {
                const bStart = toMinutes(o.start_time);
                const bEnd = o.end_time ? toMinutes(o.end_time) : bStart + 60;
                return (slotStart < bEnd) && (slotEnd > bStart);
            });
            if (ov) {
                status = 'available';
                unavailableReason = '';
                availableOverrideId = ov.id || null;
            }
        }

        // Add to list if it starts before closing
        if (slotStart < endMin) {
            allSlots.push({
                time: formatTime(slotStart),
                available: status === 'available',
                reason: unavailableReason,
                blockedReason: blockReason,
                blockedId: blockId,
                availableOverrideId,
                debug: `start:${slotStart} end:${slotEnd}`
            });
        }
    }

    const hasAvailable = allSlots.some(s => s.available);
    let globalReason = null;
    
    // Generate detailed summary
    const availableCount = allSlots.filter(s => s.available).length;
    let summaryReason = 'AVAILABLE';
    
    if (availableCount === 0) {
        if (allSlots.every(s => s.reason === 'past')) summaryReason = 'PAST_DAY';
        else if (allSlots.every(s => s.reason === 'closed')) summaryReason = 'CLOSED_DAY';
        else {
             summaryReason = 'FULL';
        }
    }

    return NextResponse.json({ 
        slots: allSlots,
        summary: {
            date: dateStr,
            isOpen: true, // simplified, relying on date check
            reason: summaryReason,
            openTime,
            closeTime
        }
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
