'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminBookingModal from '@/app/components/AdminBookingModal';
import ConfirmationModal from '@/app/components/ConfirmationModal';
import RescheduleModal from '@/app/components/RescheduleModal';
import { ChevronLeft, ChevronRight, Plus, Menu, Check, Coffee, Clock, Hourglass, Lock, LockOpen, AlertCircle } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';

export default function CalendarDashboard() {
    const { toggleSidebar, isOpen: isSidebarOpen } = useSidebar();
    const { data: session } = useSession();
    const router = useRouter();
    const [leads, setLeads] = useState<any[]>([]);
    const [procedures, setProcedures] = useState<any[]>([]);
    const [slotProcedureId, setSlotProcedureId] = useState<number | null>(null);
    const [availableSlots, setAvailableSlots] = useState<{ time: string, available: boolean, reason?: string, blockedReason?: string | null, blockedId?: number | null }[]>([]);
    const [slotMeta, setSlotMeta] = useState<{ openTime?: string; closeTime?: string }>({});
    const [slotsRefreshTick, setSlotsRefreshTick] = useState(0);
    const [initialTime, setInitialTime] = useState<string | undefined>(undefined);
    const [unblockModal, setUnblockModal] = useState<{ isOpen: boolean; id: number | null; label?: string; time?: string; end?: string }>({ isOpen: false, id: null });
    const [blockModal, setBlockModal] = useState<{ isOpen: boolean; time?: string }>({ isOpen: false });
    const [blockReason, setBlockReason] = useState('Bloqueado');
    const [blockDuration, setBlockDuration] = useState(30);

    // YYYY-MM-DD
    const [selectedDay, setSelectedDay] = useState<string | null>(null);

    const [currentDate, setCurrentDate] = useState(new Date());

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [bookingToEdit, setBookingToEdit] = useState<any>(null); // EDIT MODE STATE

    // Swipe State
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    // Swipe Handlers
    const minSwipeDistance = 50;
    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };
    const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            if (selectedDay) {
                // Next day logic if needed, or swipe month
                const next = new Date(selectedDay);
                next.setDate(next.getDate() + 1);
                setSelectedDay(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`);
            } else {
                nextMonth();
            }
        } else if (isRightSwipe) {
            if (selectedDay) {
                // Prev day
                const prev = new Date(selectedDay);
                prev.setDate(prev.getDate() - 1);
                setSelectedDay(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`);
            } else {
                prevMonth();
            }
        }
    };


    const [modal, setModal] = useState<{
        isOpen: boolean;
        type: 'realizado' | 'cancelado' | 'agendado' | 'excluir' | null;
        id: number | null;
    }>({ isOpen: false, type: null, id: null });

    const [rescheduleModal, setRescheduleModal] = useState<{
        isOpen: boolean;
        lead: any | null;
    }>({ isOpen: false, lead: null });


    const confirmAction = (id: number, type: 'realizado' | 'cancelado' | 'agendado' | 'excluir') => {
        setModal({ isOpen: true, id, type });
    };

    const handleUpdate = async () => {
        if (!modal.id || !modal.type) return;
        try {
            if (modal.type === 'excluir') {
                await fetch(`/api/leads/${modal.id}/delete`, { method: 'DELETE' });
                setLeads(leads.filter(l => l.id !== modal.id));
            } else {
                await fetch(`/api/leads/${modal.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ status: modal.type }),
                    headers: { 'Content-Type': 'application/json' }
                });
                setLeads(leads.map(l => l.id === modal.id ? { ...l, status: modal.type } : l));
            }
        } catch (e) {
            alert('Erro ao atualizar');
        } finally {
            setModal({ isOpen: false, id: null, type: null });
        }
    };

    const handleReschedule = async (date: string, time: string, procedureId?: number) => {
        if (!rescheduleModal.lead) return;
        try {
            await fetch(`/api/leads/${rescheduleModal.lead.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ appointmentDate: date, appointmentTime: time, procedureId }),
                headers: { 'Content-Type': 'application/json' }
            });

            // Update local state deeply
            setLeads(leads.map(l => {
                if (l.id === rescheduleModal.lead.id) {
                    return { ...l, appointment_date: date, appointment_time: time, status: 'agendado' };
                }
                return l;
            }));
            setRescheduleModal({ isOpen: false, lead: null });
        } catch (e) {
            alert('Erro ao reagendar');
        }
    };

    // --- LONG PRESS HANDLER FOR EDIT MODE ---
    const handleLongPress = (lead: any) => {
        setInitialTime(undefined);
        setBookingToEdit(lead);
        setIsCreateModalOpen(true);
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    };

    useEffect(() => {
        fetch('/api/leads/list')
            .then((res) => {
                if (res.status === 401) router.push('/login');
                return res.json();
            })
            .then((data) => {
                if (Array.isArray(data)) {
                    setLeads(data);
                } else if (Array.isArray(data?.leads)) {
                    setLeads(data.leads);
                }
            })
            .catch(() => { });
    }, [modal.isOpen, rescheduleModal.isOpen, isCreateModalOpen]);

    // Load procedures for available slots selector
    useEffect(() => {
        fetch('/api/procedures')
            .then(res => res.json())
            .then(data => {
                const list = Array.isArray(data) ? data : data.procedures || [];
                setProcedures(list);
                if (list.length > 0 && !slotProcedureId) setSlotProcedureId(list[0].id);
            })
            .catch(() => setProcedures([]));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch available slots for selected day + procedure
    useEffect(() => {
        if (!selectedDay || !slotProcedureId) {
            setAvailableSlots([]);
            return;
        }
        fetch(`/api/slots/available?date=${selectedDay}&procedureId=${slotProcedureId}`)
            .then(res => res.json())
            .then(data => {
                setAvailableSlots(data.slots || []);
                setSlotMeta({
                    openTime: data?.summary?.openTime ? String(data.summary.openTime).slice(0, 5) : undefined,
                    closeTime: data?.summary?.closeTime ? String(data.summary.closeTime).slice(0, 5) : undefined
                });
            })
            .catch(() => {
                setAvailableSlots([]);
                setSlotMeta({});
            });
    }, [selectedDay, slotProcedureId, slotsRefreshTick]);


    // CALENDAR UTILS
    const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const startDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const goToToday = () => {
        const now = new Date();
        setCurrentDate(now);
        // If in day view, jump to today's list
        if (selectedDay) {
            setSelectedDay(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
        }
    };

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    // Group leads by date (normalize DB date types to YYYY-MM-DD)
    const normalizeDateKey = (value: any) => {
        if (!value) return null;
        if (value instanceof Date) return value.toISOString().slice(0, 10);
        if (typeof value === 'string') {
            if (value.length >= 10) return value.slice(0, 10);
            return value;
        }
        return null;
    };

    const leadsByDate: Record<string, any[]> = {};
    leads.forEach(lead => {
        const key = normalizeDateKey(lead.appointment_date);
        if (!key) return;
        if (!leadsByDate[key]) leadsByDate[key] = [];
        leadsByDate[key].push(lead);
    });

    const isToday = (dateStr: string) => {
        const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
        return dateStr === todayStr;
    };

    // Sort leads by time
    Object.keys(leadsByDate).forEach(key => {
        leadsByDate[key].sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
    });

    // --- DAY VIEW HELPERS ---
    const getWeekDays = (dateStr: string) => {
        const date = new Date(dateStr + 'T12:00:00'); // Safe parsing?
        const current = new Date(date);
        // Find Sunday
        const day = current.getDay();
        const diff = current.getDate() - day; // adjust when day is sunday
        const sunday = new Date(current.setDate(diff));

        const week = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(sunday);
            d.setDate(sunday.getDate() + i);
            week.push(d);
        }
        return week;
    }

    const getDayLeads = (dateStr: string) => {
        return leadsByDate[dateStr] || [];
    }

    // Helper to get color based on ID/String (consistent)
    const getAccentColor = (str: string) => {
        const colors = [
            'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-teal-500',
            'bg-indigo-500', 'bg-orange-500', 'bg-cyan-500'
        ];
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    }
    const getAccentColorHex = (str: string) => {
        // Just matching above classes for ring/shadow logic if needed,
        // but simple class is easier.
        return '';
    }

    const addMinutes = (time: string, mins: number) => {
        const [h, m] = time.split(':').map(Number);
        const total = h * 60 + m + mins;
        const hh = Math.floor(total / 60).toString().padStart(2, '0');
        const mm = (total % 60).toString().padStart(2, '0');
        return `${hh}:${mm}`;
    };

    const refreshSlots = () => setSlotsRefreshTick((t) => t + 1);

    const handleBlockSlot = async (time: string, durationMinutes: number, reason: string) => {
        if (!selectedDay) return;
        try {
            await fetch('/api/slots/block', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: selectedDay,
                    startTime: time,
                    endTime: addMinutes(time, durationMinutes),
                    reason
                })
            });
            refreshSlots();
        } catch {
            alert('Erro ao bloquear horário');
        }
    };

    const handleUnlockLunch = async (time: string) => {
        if (!selectedDay) return;
        try {
            await fetch('/api/slots/block', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: selectedDay,
                    startTime: time,
                    endTime: addMinutes(time, 30),
                    reason: 'override'
                })
            });
            refreshSlots();
        } catch {
            alert('Erro ao liberar horário de almoço');
        }
    };

    const handleUnblockSlot = async (id?: number | null) => {
        if (!id) return;
        try {
            await fetch(`/api/slots/block?id=${id}`, { method: 'DELETE' });
            refreshSlots();
        } catch {
            alert('Erro ao desbloquear horário');
        }
    };

    const statusMap: Record<string, { bar: string; badge: string; label: string; icon?: 'check' | 'hourglass'; iconBg?: string; iconColor?: string }> = {
        agendado: {
            bar: 'bg-emerald-500',
            badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
            label: 'Confirmado',
            icon: 'check',
            iconBg: 'bg-emerald-500/10',
            iconColor: 'text-emerald-500'
        },
        pendente: {
            bar: 'bg-purple-500',
            badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
            label: 'Aguardando',
            icon: 'hourglass',
            iconBg: 'bg-purple-500/10',
            iconColor: 'text-purple-500'
        },
        cancelado: {
            bar: 'bg-rose-500',
            badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400',
            label: 'Cancelado'
        },
        realizado: {
            bar: 'bg-sky-500',
            badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400',
            label: 'Realizado',
            icon: 'check',
            iconBg: 'bg-sky-500/10',
            iconColor: 'text-sky-500'
        }
    };

    return (
        <div
            className="flex flex-col h-full bg-white dark:bg-slate-950 font-sans"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {/* Header Top Row */}
            <div className="fixed top-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur px-6 py-4 pt-6 shrink-0 border-b border-slate-100 dark:border-slate-900">
                <div className="flex items-center justify-between">
                    <div className="w-10" />

                    {/* Title Changes based on View */}
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white font-display tracking-tight">
                        {selectedDay ? 'Agenda Detalhada' : 'Agenda Diária'}
                    </h1>

                    <button
                        onClick={goToToday}
                        className="bg-[#f3e8ff] dark:bg-fuchsia-900/40 text-fuchsia-600 dark:text-fuchsia-300 px-4 py-2 rounded-full text-sm font-bold hover:bg-[#e9d5ff] transition-colors"
                    >
                        Today
                    </button>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between px-6 pb-2 shrink-0 pt-20">
                <button onClick={prevMonth} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2">
                    <ChevronLeft size={24} />
                </button>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 capitalize font-display">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <button onClick={nextMonth} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2">
                    <ChevronRight size={24} />
                </button>
            </div>

            {/* Weekday Header */}
            <div className="grid grid-cols-7 px-2 pb-1 pt-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d) => (
                    <div key={d} className="text-center">
                        {d}
                    </div>
                ))}
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 flex flex-col overflow-hidden relative px-2 pb-4 pt-2">

                {/* MONTH GRID VIEW */}
                <div className={`
                    grid grid-cols-7 w-full transition-all duration-300 ease-in-out
                    ${selectedDay ? 'h-[280px] shrink-0 overflow-hidden' : 'auto-rows-fr flex-1 overflow-y-auto no-scrollbar'}
                `}>
                    {/* Header Days - Only show if large view or stick it? */}
                    {/* Actually better to put header *outside* this div to persist. done above. */}

                    {/* Empty Slots */}
                    {Array.from({ length: startDayOfMonth(currentDate) }).map((_, i) => (
                        <div key={`empty-${i}`} className={`flex flex-col items-center justify-start opacity-30 ${selectedDay ? 'pt-2' : 'pt-4'}`} />
                    ))}

                    {/* Days */}
                    {Array.from({ length: daysInMonth(currentDate) }).map((_, i) => {
                        const day = i + 1;
                        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const dayLeads = leadsByDate[dateStr] || [];
                        const isCurrent = isToday(dateStr);
                        const isSelected = selectedDay === dateStr;

                        return (
                            <div
                                key={day}
                                className={`
                                    flex flex-col items-center justify-start cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/30 rounded-lg transition-all
                                    ${selectedDay ? 'pt-2 aspect-[1/0.8]' : 'pt-4 aspect-[1/1.1]'}
                                `}
                                onClick={() => {
                                    if (selectedDay === dateStr) setSelectedDay(null); // Toggle off
                                    else setSelectedDay(dateStr);
                                }}
                            >
                                <div className={`
                                    flex flex-col items-center justify-center rounded-full transition-all
                                    ${isCurrent
                                        ? selectedDay ? 'bg-[#ec4899] text-white shadow-lg shadow-pink-100 dark:shadow-none size-7' : 'bg-[#ec4899] text-white shadow-lg shadow-pink-100 dark:shadow-none size-8'
                                        : isSelected ? 'text-slate-600 dark:text-slate-400 font-semibold size-6 ring-2 ring-fuchsia-400' : 'text-slate-600 dark:text-slate-400 font-semibold size-7'}
                                    ${isSelected && !isCurrent ? 'scale-90' : ''}
                                `}>
                                    <span className={selectedDay ? "text-sm font-bold" : "text-base font-bold"}>{day}</span>
                                </div>

                                {/* Leads Dots or Names */}
                                {!selectedDay ? (
                                    // Full Name View (Expanded/Default)
                                    <div className="flex flex-col items-center w-full px-1">
                                        {dayLeads.slice(0, 2).map((lead) => (
                                            <div
                                                key={lead.id}
                                                className={`
                                                    text-[10px] w-full text-center leading-tight truncate mt-0.5 font-medium
                                                    ${isCurrent ? 'text-[#ec4899] dark:text-fuchsia-400' : 'text-slate-400 dark:text-slate-500'}
                                                `}
                                            >
                                                {lead.client_name || lead.name || 'Cliente'}
                                            </div>
                                        ))}
                                        {dayLeads.length > 2 && (
                                            <span className="text-[9px] text-slate-300 mt-0.5 leading-tight">+{dayLeads.length - 2}</span>
                                        )}
                                    </div>
                                ) : (
                                    // Compact Dot View (When list is shown below)
                                    <div className="flex gap-0.5 mt-1 flex-wrap justify-center px-2">
                                        {dayLeads.slice(0, 3).map((lead) => (
                                            <div key={lead.id} className="size-1 rounded-full bg-fuchsia-500/50" />
                                        ))}
                                        {dayLeads.length > 3 && <div className="size-1 rounded-full bg-slate-300" />}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* DAY TIMELINE VIEW (Appears Below) */}
                {selectedDay && (
                    <div className="flex-1 overflow-y-auto animate-slide-up border-t border-slate-100 dark:border-slate-800 mt-4 pt-4">
                        <div className="sr-only">
                            {new Date(selectedDay + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                        </div>

                        <div className="flex flex-col gap-4 px-4 pb-20">
                            {(() => {
                                const dayLeads = getDayLeads(selectedDay);
                                const slots = [...availableSlots].sort((a, b) => a.time.localeCompare(b.time));

                                if (slots.length === 0 && dayLeads.length === 0) {
                                    return (
                                        <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                                            <p>Nenhum agendamento.</p>
                                            <button onClick={() => { setInitialTime(undefined); setBookingToEdit(null); setIsCreateModalOpen(true); }} className="mt-2 text-fuchsia-600 font-bold text-sm">+ Adicionar</button>
                                        </div>
                                    );
                                }

                                const slotTimes = slots.map(s => s.time);
                                const slotMap = new Map(slots.map(s => [s.time, s]));

                                const leadsByStart = new Map<string, any>();
                                const leadSpanByStart = new Map<string, number>();
                                const occupiedTimes = new Set<string>();

                                dayLeads.forEach((lead: any) => {
                                    const start = lead.appointment_time.slice(0, 5);
                                    const duration = Number(lead.procedure_duration || lead.duration || 30);
                                    const span = Math.max(1, Math.ceil(duration / 30));
                                    leadsByStart.set(start, lead);
                                    leadSpanByStart.set(start, span);
                                    for (let i = 0; i < span; i++) {
                                        occupiedTimes.add(addMinutes(start, i * 30));
                                    }
                                });

                                return (
                                    <div className="grid grid-cols-[70px_1fr] gap-y-3" style={{ gridAutoRows: '72px' }}>
                                        {slotTimes.map((time, idx) => (
                                            <div
                                                key={`time-${time}`}
                                                className="flex flex-col items-center pt-2 min-w-[60px]"
                                                style={{ gridColumn: 1, gridRow: idx + 1 }}
                                            >
                                                <span className="text-lg font-bold text-slate-800 dark:text-white">{time}</span>
                                                <span className="text-xs text-slate-400 uppercase">
                                                    {parseInt(time.slice(0, 2)) >= 12 ? 'PM' : 'AM'}
                                                </span>
                                            </div>
                                        ))}

                                        {slotTimes.map((time, idx) => {
                                            const row = idx + 1;
                                            const lead = leadsByStart.get(time);
                                            if (lead) {
                                                const span = leadSpanByStart.get(time) || 1;
                                                const status = statusMap[lead.status] || statusMap.agendado;
                                                return (
                                                    <div
                                                        key={`lead-${lead.id}`}
                                                        style={{ gridColumn: 2, gridRow: `${row} / span ${span}` }}
                                                        onClick={() => handleLongPress(lead)}
                                                        className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group active:scale-[0.98] transition-all cursor-pointer"
                                                    >
                                                        <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${status.bar}`} />

                                                        <div className="flex justify-between items-start pl-2">
                                                            <div className="flex flex-col">
                                                                <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
                                                                    {lead.procedure_name || 'Procedimento'}
                                                                </h3>

                                                                <div className="flex items-center gap-2 mt-2">
                                                                    <div className="size-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase">
                                                                        {(lead.client_name || lead.name || 'C').charAt(0)}
                                                                    </div>
                                                                    <span className="text-sm text-slate-500 dark:text-slate-400">
                                                                        {lead.client_name || lead.name || 'Cliente Sem Nome'}
                                                                    </span>
                                                                </div>

                                                                <div className="flex items-center gap-3 mt-4">
                                                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800/50">
                                                                        <Clock size={12} className="text-slate-400" />
                                                                        <span className="text-xs text-slate-500 font-medium">
                                                                            {lead.procedure_duration || lead.duration || 30}m
                                                                        </span>
                                                                    </div>

                                                                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${status.badge}`}>
                                                                        {status.label || lead.status}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="mt-1">
                                                                {status.icon === 'check' ? (
                                                                    <div className={`${status.iconBg} p-1.5 rounded-full`}>
                                                                        <Check size={16} className={status.iconColor} />
                                                                    </div>
                                                                ) : status.icon === 'hourglass' ? (
                                                                    <div className={`${status.iconBg} p-1.5 rounded-full`}>
                                                                        <Hourglass size={16} className={status.iconColor} />
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            if (occupiedTimes.has(time)) return null;

                                            const slot = slotMap.get(time);
                                            if (!slot) return null;

                                            if (slot.available) {
                                                return (
                                                    <div
                                                        key={`slot-${time}`}
                                                        style={{ gridColumn: 2, gridRow: row }}
                                                        className="flex items-center justify-between bg-white/60 dark:bg-slate-900/60 rounded-2xl px-4 border border-dashed border-slate-300 dark:border-slate-700 relative overflow-hidden"
                                                    >
                                                        <button
                                                            onClick={() => {
                                                                setBookingToEdit(null);
                                                                setInitialTime(time);
                                                                setIsCreateModalOpen(true);
                                                            }}
                                                            className="flex items-center gap-3 text-left"
                                                        >
                                                            <div className="size-7 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                                                <Plus size={16} />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Disponível</span>
                                                                <span className="text-xs text-slate-400">Clique para agendar</span>
                                                            </div>
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setBlockDuration(30);
                                                                setBlockReason('Bloqueado');
                                                                setBlockModal({ isOpen: true, time });
                                                            }}
                                                            className="bg-slate-200/60 dark:bg-slate-800/60 p-2 rounded-full"
                                                            title="Bloquear horário"
                                                        >
                                                            <Lock size={16} className="text-slate-500" />
                                                        </button>
                                                    </div>
                                                );
                                            }

                                            if (slot.reason === 'lunch' || slot.reason === 'blocked' || slot.reason === 'busy' || slot.reason === 'past') {
                                                const label = slot.reason === 'lunch'
                                                    ? 'Almoço'
                                                    : slot.reason === 'blocked'
                                                        ? (slot.blockedReason || 'Bloqueado')
                                                        : slot.reason === 'past'
                                                            ? 'Passado'
                                                            : 'Ocupado (sobreposição)';
                                                const isBusy = slot.reason === 'busy';
                                                const isLunch = slot.reason === 'lunch';
                                                const isBlocked = slot.reason === 'blocked';
                                                const isNoReason = isBlocked && (!slot.blockedReason || slot.blockedReason.trim() === '');
                                                const isPast = slot.reason === 'past';
                                                return (
                                                    <div
                                                        key={`blocked-${time}`}
                                                        style={{ gridColumn: 2, gridRow: row }}
                                                        className={`rounded-2xl p-4 border relative overflow-hidden ${
                                                            isBusy
                                                                ? 'border-slate-300/70 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50'
                                                                : isLunch
                                                                    ? 'border-amber-300/60 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-900/20'
                                                                    : isNoReason
                                                                        ? 'border-slate-400/60 dark:border-slate-600 bg-slate-100/40 dark:bg-slate-900/30'
                                                                        : 'border-fuchsia-300/60 dark:border-fuchsia-700 bg-fuchsia-50/40 dark:bg-fuchsia-900/20'
                                                        }`}
                                                    >
                                                        <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(135deg,transparent,transparent_6px,rgba(148,163,184,0.25)_6px,rgba(148,163,184,0.25)_12px)]" />
                                                        <div className="relative flex items-center justify-between pl-2">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
                                                                <span className="text-xs text-slate-400">Indisponível</span>
                                                            </div>
                                                            {isBlocked ? (
                                                                <button
                                                                    onClick={() => setUnblockModal({
                                                                        isOpen: true,
                                                                        id: slot.blockedId || null,
                                                                        label,
                                                                        time,
                                                                        end: addMinutes(time, 30)
                                                                    })}
                                                                    className={`${isNoReason ? 'bg-slate-200/60 dark:bg-slate-800/60' : 'bg-fuchsia-200/40 dark:bg-fuchsia-800/40'} p-2 rounded-full`}
                                                                    title="Desbloquear horário"
                                                                >
                                                                    {isNoReason ? <AlertCircle size={16} className="text-slate-500" /> : <Lock size={16} className="text-fuchsia-400" />}
                                                                </button>
                                                            ) : isLunch ? (
                                                                <button
                                                                    onClick={() => handleUnlockLunch(time)}
                                                                    className="bg-amber-200/40 dark:bg-amber-800/40 p-2 rounded-full"
                                                                    title="Liberar horário de almoço"
                                                                >
                                                                    <LockOpen size={16} className="text-amber-500" />
                                                                </button>
                                                            ) : (
                                                                <div className="bg-slate-200/60 dark:bg-slate-800/60 p-2 rounded-full">
                                                                    {isPast ? <Clock size={16} className="text-slate-500" /> : <Clock size={16} className="text-slate-500" />}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            return null;
                                        })}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <AdminBookingModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setInitialTime(undefined);
                    setIsCreateModalOpen(false);
                }}
                onSuccess={() => {
                    setIsCreateModalOpen(false);
                    // refresh if needed
                }}
                initialDate={selectedDay || undefined}
                initialTime={initialTime}
                bookingToEdit={bookingToEdit}
            />

            <ConfirmationModal
                isOpen={modal.isOpen}
                onCancel={() => setModal({ isOpen: false, id: null, type: null })}
                onConfirm={handleUpdate}
                title={modal.type === 'excluir' ? 'Excluir Agendamento' : 'Confirmar Ação'}
                message={modal.type === 'excluir' ? 'Tem certeza que deseja excluir?' : `Deseja marcar como ${modal.type}?`}
            />

            {/* Unblock Modal */}
            {unblockModal.isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-end justify-center p-4 bg-black/40 backdrop-blur-md" style={{ zIndex: 9999 }}>
                    <div className="w-full max-w-sm bg-[#1a0f16]/90 border border-fuchsia-500/30 rounded-3xl shadow-2xl shadow-fuchsia-500/20 p-6 pb-5">
                        <div className="mx-auto h-1 w-12 rounded-full bg-white/20 mb-5" />
                        <div className="flex items-center justify-center mb-4">
                            <div className="size-12 rounded-full bg-fuchsia-600/20 border border-fuchsia-500/40 flex items-center justify-center">
                                <Lock size={20} className="text-fuchsia-300" />
                            </div>
                        </div>
                        <h3 className="text-center text-lg font-bold text-white mb-2">
                            Desbloquear Horário?
                        </h3>
                        <p className="text-center text-sm text-fuchsia-100/80 mb-5">
                            Este horário está atualmente bloqueado para:
                            <span className="block mt-1 font-semibold text-white">
                                {unblockModal.label || 'Bloqueado'}
                                {unblockModal.time ? ` • ${unblockModal.time}${unblockModal.end ? `–${unblockModal.end}` : ''}` : ''}
                            </span>
                        </p>
                        <button
                            onClick={() => {
                                const id = unblockModal.id;
                                setUnblockModal({ isOpen: false, id: null });
                                handleUnblockSlot(id);
                            }}
                            className="w-full py-3 rounded-xl font-bold text-white bg-fuchsia-600 hover:bg-fuchsia-500 transition-colors shadow-lg shadow-fuchsia-600/30"
                        >
                            Confirmar Desbloqueio
                        </button>
                        <button
                            onClick={() => setUnblockModal({ isOpen: false, id: null })}
                            className="w-full mt-3 py-3 rounded-xl font-semibold text-fuchsia-100/80 border border-white/10 hover:bg-white/5 transition-colors"
                        >
                            Manter Bloqueado
                        </button>
                    </div>
                </div>
            )}

            {/* Block Modal */}
            {blockModal.isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-end justify-center p-4 bg-black/40 backdrop-blur-md" style={{ zIndex: 9999 }}>
                    <div className="w-full max-w-sm bg-[#1a0f16]/90 border border-fuchsia-500/30 rounded-3xl shadow-2xl shadow-fuchsia-500/20 p-6 pb-5">
                        <div className="mx-auto h-1 w-12 rounded-full bg-white/20 mb-5" />
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white">Bloquear Horário</h3>
                            <button
                                onClick={() => setBlockModal({ isOpen: false })}
                                className="text-white/60 hover:text-white"
                                aria-label="Fechar"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                                <div className="text-xs text-fuchsia-100/70 mb-1">Início</div>
                                <div className="text-white font-semibold">{blockModal.time}</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                                <div className="text-xs text-fuchsia-100/70 mb-1">Fim</div>
                                <div className="text-white font-semibold">
                                    {blockModal.time ? addMinutes(blockModal.time, blockDuration) : '--:--'}
                                </div>
                            </div>
                        </div>

                        <div className="text-xs text-fuchsia-100/70 mb-2">Duração rápida</div>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {[15, 30, 60].map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setBlockDuration(m)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${
                                        blockDuration === m
                                            ? 'bg-fuchsia-600 text-white border-fuchsia-500'
                                            : 'bg-white/5 text-fuchsia-100/80 border-white/10 hover:bg-white/10'
                                    }`}
                                >
                                    {m === 60 ? '1h' : `${m}min`}
                                </button>
                            ))}
                            {(() => {
                                const canUntilEnd = !!slotMeta.closeTime && !!blockModal.time && (() => {
                                    if (!slotMeta.closeTime || !blockModal.time) return false;
                                    const [h1, m1] = blockModal.time.split(':').map(Number);
                                    const [h2, m2] = slotMeta.closeTime.split(':').map(Number);
                                    return (h2 * 60 + m2) > (h1 * 60 + m1);
                                })();
                                return (
                                    <button
                                        onClick={() => {
                                            if (!blockModal.time || !slotMeta.closeTime) return;
                                            const [h1, m1] = blockModal.time.split(':').map(Number);
                                            const [h2, m2] = slotMeta.closeTime.split(':').map(Number);
                                            const total = (h2 * 60 + m2) - (h1 * 60 + m1);
                                            if (total > 0) setBlockDuration(total);
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${
                                            slotMeta.closeTime && blockModal.time && blockDuration > 0 && addMinutes(blockModal.time, blockDuration) === slotMeta.closeTime
                                                ? 'bg-fuchsia-600 text-white border-fuchsia-500'
                                                : canUntilEnd
                                                    ? 'bg-white/5 text-fuchsia-100/80 border-white/10 hover:bg-white/10'
                                                    : 'bg-white/5 text-white/30 border-white/10'
                                        }`}
                                        disabled={!canUntilEnd}
                                    >
                                Até o fim
                                    </button>
                                );
                            })()}
                        </div>

                        <div className="text-xs text-fuchsia-100/70 mb-2">Motivo</div>
                        <input
                            value={blockReason}
                            onChange={(e) => setBlockReason(e.target.value)}
                            className="w-full mb-5 bg-white/5 text-white placeholder:text-white/40 rounded-xl px-4 py-3 border border-white/10 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/60"
                            placeholder="Ex.: Almoço, Reunião, Feriado"
                        />

                        <button
                            onClick={() => {
                                if (blockModal.time) {
                                    handleBlockSlot(blockModal.time, blockDuration, blockReason || 'Bloqueado');
                                }
                                setBlockModal({ isOpen: false });
                            }}
                            className="w-full py-3 rounded-xl font-bold text-white bg-fuchsia-600 hover:bg-fuchsia-500 transition-colors shadow-lg shadow-fuchsia-600/30"
                        >
                            Bloquear Horário
                        </button>
                    </div>
                </div>
            )}

            <RescheduleModal
                isOpen={rescheduleModal.isOpen}
                onClose={() => setRescheduleModal({ isOpen: false, lead: null })}
                onConfirm={(date, time) => handleReschedule(date, time)}
                currentDate={rescheduleModal.lead?.appointment_date}
                currentTime={rescheduleModal.lead?.appointment_time}
                procedureId={rescheduleModal.lead?.procedure_id || 0}
            />

        </div>
    );
}
