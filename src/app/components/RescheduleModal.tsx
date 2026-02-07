'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock as ClockIcon, CalendarCheck } from 'lucide-react';
import Calendar from './Calendar';

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
  const [isCustomTime, setIsCustomTime] = useState(false);

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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#120b12] border border-fuchsia-500/20 rounded-3xl shadow-2xl max-w-md w-full transform transition-all scale-100 flex flex-col max-h-[85vh]">
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
            <div className="flex justify-center">
                <Calendar selectedDate={date} onSelectDate={(d) => { setDate(d); setTime(''); }} />
            </div>

            {date && (
                <>
                    <div className="flex items-center justify-between pb-3 pt-5">
                        <h2 className="text-white text-base font-bold leading-tight tracking-[-0.015em]">Horários para {formatDateBR(date)}</h2>
                        <button
                            type="button"
                            onClick={() => {
                                setIsCustomTime(!isCustomTime);
                                setTime('');
                            }}
                            className="text-xs font-semibold text-[#ee2b7c] border border-[#ee2b7c]/40 rounded-full px-3 py-1 hover:bg-[#ee2b7c]/10 transition-colors"
                        >
                            {isCustomTime ? 'Voltar aos horários' : 'Horário personalizado'}
                        </button>
                    </div>
                    {isCustomTime ? (
                        <div className="p-3 bg-[#1b121b] border border-white/10 rounded-2xl flex flex-col items-center">
                            <div className="flex gap-2 items-center">
                                <select 
                                    value={time?.split(':')[0] || ''}
                                    onChange={(e) => {
                                        const newH = e.target.value;
                                        const curM = time?.split(':')[1] || '00';
                                        setTime(`${newH}:${curM}`);
                                    }}
                                    className="p-2 bg-[#120b12] border border-white/10 rounded-lg text-lg font-bold text-white outline-none focus:ring-2 focus:ring-[#ee2b7c] w-20 text-center appearance-none"
                                >
                                    {Array.from({ length: 24 }).map((_, i) => {
                                        const h = i.toString().padStart(2, '0');
                                        return <option key={h} value={h}>{h}</option>;
                                    })}
                                </select>
                                <span className="text-xl font-bold text-white">:</span>
                                <select 
                                    value={time?.split(':')[1] || ''}
                                    onChange={(e) => {
                                        const curH = time?.split(':')[0] || '09';
                                        const newM = e.target.value;
                                        setTime(`${curH}:${newM}`);
                                    }}
                                    className="p-2 bg-[#120b12] border border-white/10 rounded-lg text-lg font-bold text-white outline-none focus:ring-2 focus:ring-[#ee2b7c] w-20 text-center appearance-none"
                                >
                                    {Array.from({ length: 12 }).map((_, i) => {
                                        const m = (i * 5).toString().padStart(2, '0');
                                        return <option key={m} value={m}>{m}</option>;
                                    })}
                                </select>
                            </div>
                        </div>
                    ) : (
                        loading ? (
                            <div className="text-center py-6 text-white/60">Buscando horários...</div>
                        ) : slots.length === 0 ? (
                            <div className="text-center py-6 bg-[#1b121b] text-white/60 rounded-2xl border border-white/10">
                                Sem horários livres nesta data.
                            </div>
                        ) : (
                            <div className="flex gap-3 flex-wrap">
                                {slots.map(s => {
                                    const isSelectable = s.available || s.reason === 'past';
                                    const isSelected = time === s.time;

                                    return (
                                        <button
                                            type="button"
                                            key={s.time}
                                            disabled={!isSelectable}
                                            onClick={() => isSelectable && setTime(s.time)}
                                            className={`h-10 min-w-[80px] px-4 rounded-lg text-sm font-medium transition-all ${
                                                isSelected
                                                    ? 'bg-[#ee2b7c] text-white shadow-md shadow-[#ee2b7c]/30' 
                                                    : s.available 
                                                        ? 'bg-[#1b121b] border border-white/10 text-white/80 hover:border-[#ee2b7c] hover:text-white'
                                                        : s.reason === 'past'
                                                            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                                                            : 'bg-white/5 text-white/30 opacity-50 cursor-not-allowed line-through'
                                            }`}
                                            title={!isSelectable ? (s.reason === 'busy' ? 'Ocupado' : 'Indisponível') : (s.reason === 'past' ? 'Horário Passado (Ajuste)' : 'Disponível')}
                                        >
                                            {s.time}
                                        </button>
                                    );
                                })}
                            </div>
                        )
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
