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

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 transform transition-all scale-100 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
            <div>
                <h3 className="text-xl font-bold text-white">Reagendar Atendimento</h3>
                <p className="text-sm text-slate-400">De: <span className="font-medium text-slate-200">{currentDate ? currentDate.split('T')[0].split('-').reverse().join('/') : '-'}</span></p>
            </div>
            <button onClick={onClose} type="button" className="text-slate-400 hover:text-white font-bold text-xl">✕</button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar px-1">
            
            {/* Step 1: Select Procedure */}
            <div className="mb-6">
                <label className="block text-xs font-bold text-fuchsia-400 uppercase mb-2">1. Serviço</label>
                <select 
                    value={selectedProcedure || ''}
                    onChange={(e) => {
                        setSelectedProcedure(Number(e.target.value));
                        setSlots([]); // Clear slots as duration might change
                        setTime('');
                    }}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 outline-none transition-all text-white"
                >
                    {procedures.map(p => (
                        <option key={p.id} value={p.id}>
                            {p.name} ({p.duration_minutes} min) - R$ {p.price}
                        </option>
                    ))}
                </select>
            </div>

            {/* Step 2: Select Date */}
            <div className="mb-6">
                <label className="block text-xs font-bold text-fuchsia-400 uppercase mb-2">2. Nova Data</label>
                <div className="flex justify-center">
                    <Calendar selectedDate={date} onSelectDate={(d) => { setDate(d); setTime(''); }} />
                </div>
            </div>

            {date && (
                <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-bold text-fuchsia-400 uppercase">3. Novo Horário ({date.split('-').reverse().join('/')})</label>
                        <div className="flex items-center gap-2">
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
                            <label htmlFor="custom-time" className="text-xs text-slate-400 font-medium cursor-pointer select-none">
                                Horário Personalizado (Exceção)
                            </label>
                        </div>
                    </div>
                    
                    {isCustomTime ? (
                         <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-xl flex flex-col items-center">
                             <p className="text-xs text-slate-400 mb-2 w-full text-left">Selecione o horário:</p>
                             <div className="flex gap-2 items-center">
                                <select 
                                    value={time?.split(':')[0] || ''}
                                    onChange={(e) => {
                                        const newH = e.target.value;
                                        const curM = time?.split(':')[1] || '00';
                                        setTime(`${newH}:${curM}`);
                                    }}
                                    className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-lg font-bold text-white outline-none focus:ring-2 focus:ring-fuchsia-500 w-20 text-center appearance-none"
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
                                    className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-lg font-bold text-white outline-none focus:ring-2 focus:ring-fuchsia-500 w-20 text-center appearance-none"
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
                            <div className="text-center py-8 text-slate-500">Buscando horários...</div>
                        ) : slots.length === 0 ? (
                            <div className="text-center py-8 bg-red-900/10 text-red-400 rounded-xl border border-red-900/20">
                                Sem horários livres nesta data.
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                                {slots.map(s => {
                                    // Allow selecting if available OR if reason is 'past' (for historical adjustment)
                                    const isSelectable = s.available || s.reason === 'past';
                                    const isSelected = time === s.time;

                                    return (
                                        <button
                                            type="button"
                                            key={s.time}
                                            disabled={!isSelectable}
                                            onClick={() => isSelectable && setTime(s.time)}
                                            className={`py-2 px-1 rounded-lg text-sm font-medium transition-all ${
                                                isSelected
                                                ? 'bg-fuchsia-600 text-white shadow-md transform scale-105' 
                                                : s.available 
                                                    ? 'bg-slate-800 border border-slate-700 text-slate-300 hover:border-fuchsia-500 hover:text-white'
                                                    : s.reason === 'past'
                                                        ? 'bg-yellow-900/10 border border-yellow-700/30 text-yellow-600 hover:bg-yellow-900/30 hover:border-yellow-500 hover:text-yellow-400 cursor-pointer'
                                                        : 'bg-slate-900 text-slate-600 cursor-not-allowed opacity-50'
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

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button onClick={onClose} type="button" className="px-4 py-2 text-slate-400 font-bold hover:bg-slate-800 rounded-lg">
                Cancelar
            </button>
            <button 
                type="button"
                onClick={handleConfirm}
                disabled={!date || !time || submitting}
                className="px-6 py-2 bg-fuchsia-600 text-white rounded-lg font-bold shadow-lg hover:bg-fuchsia-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                {submitting ? 'Salvando...' : 'Confirmar Reagendamento'}
            </button>
        </div>
      </div>
    </div>
  );
}
