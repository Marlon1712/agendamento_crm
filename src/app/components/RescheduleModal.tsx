'use client';

import { useState, useEffect } from 'react';
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
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#120b12] border border-fuchsia-500/20 rounded-3xl shadow-2xl max-w-md w-full p-5 transform transition-all scale-100 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between mb-4">
            <button onClick={onClose} type="button" className="size-9 rounded-full bg-white/5 text-white/70 hover:text-white flex items-center justify-center">←</button>
            <h3 className="text-lg font-bold text-white">Reagendar</h3>
            <div className="size-9" />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
            <div className="bg-white/5 border border-fuchsia-500/20 rounded-2xl p-4 mb-5">
                <div className="flex items-center gap-2 text-sm text-fuchsia-200/80 mb-2">
                    <span className="size-2 rounded-full bg-fuchsia-500" />
                    Atendimento Atual
                </div>
                <div className="text-fuchsia-200 font-semibold">{currentProcedureName}</div>
                <div className="text-sm text-white/70 mt-1">
                    {formatDateBR(currentDate)} • {currentTime?.slice(0, 5) || '--:--'}
                </div>
            </div>

            <div className="text-sm font-semibold text-white/90 mb-2">Selecione uma nova data</div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 mb-5">
                <div className="flex justify-center">
                    <Calendar selectedDate={date} onSelectDate={(d) => { setDate(d); setTime(''); }} />
                </div>
            </div>

            {date && (
                <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-sm font-semibold text-white/90">Horários para {formatDateBR(date)}</div>
                        <label className="text-xs text-white/60 flex items-center gap-2">
                            <input 
                                type="checkbox" 
                                id="custom-time" 
                                className="w-4 h-4 text-fuchsia-600 rounded border-slate-600 bg-slate-800 focus:ring-fuchsia-500"
                                checked={isCustomTime}
                                onChange={(e) => {
                                    setIsCustomTime(e.target.checked);
                                    setTime(''); 
                                }}
                            />
                            Personalizado
                        </label>
                    </div>

                    {isCustomTime ? (
                        <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center">
                            <div className="flex gap-2 items-center">
                                <select 
                                    value={time?.split(':')[0] || ''}
                                    onChange={(e) => {
                                        const newH = e.target.value;
                                        const curM = time?.split(':')[1] || '00';
                                        setTime(`${newH}:${curM}`);
                                    }}
                                    className="p-2 bg-[#1b121b] border border-white/10 rounded-lg text-lg font-bold text-white outline-none focus:ring-2 focus:ring-fuchsia-500 w-20 text-center appearance-none"
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
                                    className="p-2 bg-[#1b121b] border border-white/10 rounded-lg text-lg font-bold text-white outline-none focus:ring-2 focus:ring-fuchsia-500 w-20 text-center appearance-none"
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
                            <div className="text-center py-6 text-white/50">Buscando horários...</div>
                        ) : slots.length === 0 ? (
                            <div className="text-center py-6 bg-white/5 text-white/60 rounded-2xl border border-white/10">
                                Sem horários livres nesta data.
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-2 max-h-52 overflow-y-auto">
                                {slots.map(s => {
                                    const isSelectable = s.available || s.reason === 'past';
                                    const isSelected = time === s.time;

                                    return (
                                        <button
                                            type="button"
                                            key={s.time}
                                            disabled={!isSelectable}
                                            onClick={() => isSelectable && setTime(s.time)}
                                            className={`py-2 rounded-xl text-sm font-semibold transition-all ${
                                                isSelected
                                                ? 'bg-fuchsia-600 text-white shadow-md' 
                                                : s.available 
                                                    ? 'bg-white/5 border border-white/10 text-white/80 hover:border-fuchsia-500 hover:text-white'
                                                    : s.reason === 'past'
                                                        ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                                                        : 'bg-white/5 text-white/30 cursor-not-allowed opacity-60'
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
                </div>
            )}
        </div>

        <div className="mt-5 pt-4 border-t border-white/10 flex gap-3">
            <button onClick={onClose} type="button" className="flex-1 py-3 rounded-xl border border-white/10 text-white/80 font-semibold hover:bg-white/5">
                Cancelar
            </button>
            <button 
                type="button"
                onClick={handleConfirm}
                disabled={!date || !time || submitting}
                className="flex-1 py-3 bg-fuchsia-600 text-white rounded-xl font-bold shadow-lg hover:bg-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                {submitting ? 'Salvando...' : 'Confirmar Novo Horário'}
            </button>
        </div>
      </div>
    </div>
  );
}
