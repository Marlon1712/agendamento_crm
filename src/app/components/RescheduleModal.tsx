'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock as ClockIcon, CalendarCheck } from 'lucide-react';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: string, time: string, procedureId?: number) => Promise<void>;
  procedureId: number;
  currentDate: string;
  currentTime: string;
  leadId?: number;
}

export default function RescheduleModal({
  isOpen,
  onClose,
  onConfirm,
  procedureId,
  currentDate,
  currentTime,
  leadId,
}: RescheduleModalProps) {
  const [step, setStep] = useState(1);
  const [selectedProcedure, setSelectedProcedure] = useState<number | null>(null);
  const [procedures, setProcedures] = useState<any[]>([]);
  
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [slots, setSlots] = useState<{time: string, available: boolean, reason?: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date | null>(null);

  // Initialize
  useEffect(() => {
    if (isOpen) {
        setStep(1);
        // Pre-fill date (YYYY-MM-DD from '2023-10-10T00:00:00.000Z' or already YYYY-MM-DD)
        const d = currentDate.includes('T') ? currentDate.split('T')[0] : currentDate;
        setDate(d);
        
        // Pre-fill time (HH:MM from '14:30:00')
        setTime(currentTime ? currentTime.slice(0, 5) : '');
        
        setSlots([]);
        setSelectedProcedure(procedureId);
        if (d) {
            const dt = new Date(d.split('-')[0] as any, Number(d.split('-')[1]) - 1, Number(d.split('-')[2]));
            setViewMonth(new Date(dt.getFullYear(), dt.getMonth(), 1));
        } else {
            const now = new Date();
            setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1));
        }
        
        // Fetch procedures
        fetch('/api/procedures')
            .then(res => res.json())
            .then(data => setProcedures(Array.isArray(data) ? data : data.procedures || []))
            .catch(() => setProcedures([]));
    }
  }, [isOpen, procedureId]);

  // Fetch slots when date or procedure changes
  useEffect(() => {
    if (date && selectedProcedure) {
        setLoading(true);
        const url = `/api/slots/available?date=${date}&procedureId=${selectedProcedure}` + (leadId ? `&excludeLeadId=${leadId}` : '');
        fetch(url)
            .then(res => res.json())
            .then(data => setSlots(data.slots || []))
            .catch(() => setSlots([]))
            .finally(() => setLoading(false));
    }
  }, [date, selectedProcedure, leadId]);

  const handleConfirm = async () => {
    if (!date || !time) return;
    setSubmitting(true);
    await onConfirm(date, time, selectedProcedure || undefined);
    setSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  const currentProcedureName = procedures.find(p => p.id === selectedProcedure)?.name || 'Carregando...';
  const formatDateBR = (value: string) => {
    if (!value) return '-';
    const d = value.includes('T') ? value.split('T')[0] : value;
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };
  const weekDays = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];
  const toLocalDate = (value: string) => {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };
  const formatISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const selectedDate = date ? toLocalDate(date) : new Date();
  const monthLabel = (viewMonth || selectedDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  const monthStart = viewMonth ? new Date(viewMonth) : new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  const monthDays = monthEnd.getDate();
  const firstWeekDay = (monthStart.getDay() + 6) % 7;
  const gridCells = Array.from({ length: firstWeekDay + monthDays }, (_, i) => {
    if (i < firstWeekDay) return null;
    const day = i - firstWeekDay + 1;
    return new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
  });

  useEffect(() => {
    if (!isOpen || !date) return;
    const t = setTimeout(() => {
      const el = document.querySelector(`[data-day-pill="${date}"]`) as HTMLElement | null;
      if (el) el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    }, 50);
    return () => clearTimeout(t);
  }, [isOpen, date, viewMonth]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#120b12] border border-[#2a1822] rounded-3xl shadow-2xl max-w-md w-full transform transition-all scale-100 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-4 pb-2 sticky top-0 bg-[#120b12]/90 backdrop-blur border-b border-white/10 z-10">
            <button onClick={onClose} type="button" className="size-10 rounded-full bg-white/10 text-white/80 hover:text-white flex items-center justify-center">←</button>
            <h3 className="text-lg font-bold text-white">Reagendar</h3>
            <div className="size-10" />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-6">
            <div className="mt-3 bg-[#1b121b] border border-white/10 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-[#ee2b7c]/15 text-[#ee2b7c] flex items-center justify-center">
                        <CalendarCheck size={18} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white">Atendimento Atual</p>
                        <p className="text-xs text-white/60">Originalmente agendado</p>
                    </div>
                </div>
                <div className="h-px w-full bg-white/10 my-3" />
                <div className="text-[#ee2b7c] font-bold">{currentProcedureName}</div>
                <div className="flex items-center gap-2 text-white/70 mt-2">
                    <CalendarIcon size={14} />
                    <span className="text-sm">{formatDateBR(currentDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-white/70 mt-1">
                    <ClockIcon size={14} />
                    <span className="text-sm">{currentTime?.slice(0, 5) || '--:--'}</span>
                </div>
            </div>

            <h2 className="text-white text-base font-bold leading-tight tracking-[-0.015em] pb-3 pt-5">Selecione uma nova data</h2>
            <div className="rounded-2xl border border-[#2a1822] bg-[#160d16] p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CalendarIcon size={16} className="text-[#ee2b7c]" />
                        <h4 className="text-sm font-bold text-white">Data e Hora</h4>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setViewMonth(new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1))}
                            className="h-7 w-7 rounded-full border border-[#2a1822] text-white/70 hover:text-white hover:border-[#ee2b7c]/60"
                            aria-label="Mês anterior"
                        >
                            ‹
                        </button>
                        <span className="text-xs font-semibold text-[#ee2b7c] capitalize">{monthLabel}</span>
                        <button
                            type="button"
                            onClick={() => setViewMonth(new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1))}
                            className="h-7 w-7 rounded-full border border-[#2a1822] text-white/70 hover:text-white hover:border-[#ee2b7c]/60"
                            aria-label="Próximo mês"
                        >
                            ›
                        </button>
                    </div>
                </div>
                <div className="mt-3 overflow-x-auto no-scrollbar">
                    <div className="flex gap-2 min-w-max">
                        {Array.from({ length: monthDays }).map((_, idx) => {
                            const cell = new Date(monthStart.getFullYear(), monthStart.getMonth(), idx + 1);
                            const iso = formatISO(cell);
                            const isActive = iso === date;
                            const isWeekend = cell.getDay() === 0 || cell.getDay() === 6;
                            const now = new Date();
                            const todayIso = formatISO(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
                            const isToday = iso === todayIso;
                            return (
                                <button
                                    key={iso}
                                    type="button"
                                    onClick={() => { setDate(iso); setTime(''); }}
                                    data-day-pill={iso}
                                    className={`flex flex-col items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                                        isActive
                                            ? 'border-[#ee2b7c] bg-[#ee2b7c] text-white shadow-[0_0_0_2px_rgba(238,43,124,0.15)]'
                                            : `border-[#2a1822] bg-[#1b121b] ${isWeekend ? 'text-rose-200/80' : 'text-white/80'} hover:border-[#ee2b7c]/60`
                                    } ${isToday && !isActive ? 'ring-1 ring-[#ee2b7c]/40' : ''}`}
                                >
                                    <span className={`text-[10px] uppercase tracking-wide ${isWeekend ? 'text-rose-200/60' : 'text-white/60'}`}>{weekDays[(cell.getDay() + 6) % 7]}</span>
                                    <span className={`text-sm font-bold ${isToday && !isActive ? 'text-[#ee2b7c]' : ''}`}>{String(cell.getDate()).padStart(2, '0')}</span>
                                    {isToday && !isActive && (
                                        <span className="mt-1 rounded-full bg-[#ee2b7c]/60 text-[9px] px-1.5 py-0.5 text-white/90">Hoje</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {date && (
                <>
                    <div className="flex items-center justify-between pb-3 pt-5">
                        <h2 className="text-white text-base font-bold leading-tight tracking-[-0.015em]">Horários para {formatDateBR(date)}</h2>
                    </div>
                    {loading ? (
                        <div className="text-center py-6 text-white/60">Buscando horários...</div>
                    ) : slots.length === 0 ? (
                        <div className="text-center py-6 bg-[#1b121b] text-white/60 rounded-2xl border border-white/10">
                            Sem horários livres nesta data.
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-2">
                            {slots.map(s => {
                                const isSelectable = s.available || s.reason === 'past';
                                const isSelected = time === s.time;
                                return (
                                    <button
                                        type="button"
                                        key={s.time}
                                        disabled={!isSelectable}
                                        onClick={() => isSelectable && setTime(s.time)}
                                        className={`rounded-full border px-0 py-2 text-xs font-bold transition-all ${
                                            isSelected
                                                ? 'bg-[#ee2b7c] text-white border-[#ee2b7c] shadow-[0_0_0_2px_rgba(238,43,124,0.2)]'
                                                : !isSelectable
                                                    ? 'border-[#2a1822] text-white/30 line-through bg-[#120b12]'
                                                    : 'border-[#2a1822] text-white/80 hover:border-[#ee2b7c]/70 bg-[#1b121b]'
                                        }`}
                                        title={!isSelectable ? (s.reason === 'busy' ? 'Ocupado' : 'Indisponível') : (s.reason === 'past' ? 'Horário Passado (Ajuste)' : 'Disponível')}
                                    >
                                        {s.time.slice(0, 5)}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>

        <div className="sticky bottom-0 p-4 bg-[#120b12]/90 backdrop-blur border-t border-white/10">
            <div className="flex gap-3">
                <button onClick={onClose} type="button" className="h-12 flex-1 rounded-full border border-[#ee2b7c]/30 bg-transparent text-[#ee2b7c] text-base font-bold shadow-sm transition-all hover:bg-[#ee2b7c]/10">
                    Cancelar
                </button>
                <button 
                    type="button"
                    onClick={handleConfirm}
                    disabled={!date || !time || submitting}
                    className="h-12 flex-[2] rounded-full bg-[#ee2b7c] text-white text-base font-bold shadow-lg shadow-[#ee2b7c]/30 transition-all hover:bg-[#ee2b7c]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitting ? 'Salvando...' : 'Confirmar Novo Horário'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
