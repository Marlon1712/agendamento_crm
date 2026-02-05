'use client';

import { useState, useEffect } from 'react';
import Calendar from '@/app/components/Calendar';
import { Clock, Calendar as CalendarIcon, Trash2, Lock, ChevronUp, ChevronDown } from 'lucide-react';

const formatDate = (dateString: string) => {
    if (!dateString) return 'Data Indefinida';
    const [y, m, d] = dateString.split('T')[0].split('-');
    return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
};

export default function AdminExceptions() {
  const getToday = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const adjustTime = (timeStr: string, type: 'hour' | 'minute', amount: number) => {
      const [hStr, mStr] = timeStr.split(':');
      let h = parseInt(hStr);
      let m = parseInt(mStr);

      if (type === 'hour') {
          h = (h + amount + 24) % 24;
      } else {
          m = (m + amount + 60) % 60;
          // Step 5
          m = Math.round(m / 5) * 5;
          if (m === 60) m = 0;
      }
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const updateTime = (field: 'start' | 'end', type: 'hour' | 'minute', amount: number) => {
      const currentVal = field === 'start' ? form.start_time : form.end_time;
      const newVal = adjustTime(currentVal, type, amount);
      
      const newForm = { ...form };
      if (field === 'start') {
          newForm.start_time = newVal;
          // Ensure Start <= End
          if (newVal > newForm.end_time) {
              newForm.end_time = newVal; 
          }
      } else {
          newForm.end_time = newVal;
          // Ensure End >= Start
          if (newVal < newForm.start_time) {
              newForm.start_time = newVal;
          }
      }
      setForm(newForm);
  };

  const [exceptions, setExceptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filter state
  const [selectedDate, setSelectedDate] = useState(getToday());

  const [form, setForm] = useState({ 
      date: getToday(),
      start_time: '09:00', 
      end_time: '10:00', 
      note: '',
      repeat: false,
      repeatUntil: '' 
  });

  const fetchExceptions = () => {
    setLoading(true);
    // Fetching keys for the specific date to ensure we see what we just added
    // If we want a monthly view, we'd need a different API endpoint or param
    fetch(`/api/slots/block?date=${selectedDate}`)
      .then(res => res.json())
      .then(data => {
          // Ensure data is an array
          setExceptions(Array.isArray(data) ? data : []);
      })
      .catch(err => {
          console.error("Failed to fetch blocks", err);
          setExceptions([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchExceptions();
  }, [selectedDate]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.start_time >= form.end_time) {
        alert('O horário de início deve ser menor que o fim.');
        return;
    }

    setLoading(true);
    try {
        await fetch('/api/slots/block', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date: form.date,
                startTime: form.start_time, // API likely expects camelCase or snake? Original used camel in form, snake in display. Let's send both or standard. 
                // Context: Original form had startTime/endTime. API likely reads these.
                endTime: form.end_time,
                reason: form.note,
                recurrence: form.repeat ? 'weekly' : 'none', // Simple mapping
                recurrenceEnd: form.repeatUntil
            })
        });
        
        // Refresh list
        // If the form date is different from selected view date, we might want to switch view
        if (form.date !== selectedDate) {
            setSelectedDate(form.date);
        } else {
            fetchExceptions();
        }
        
        // Reset form (keep date)
        setForm(prev => ({ ...prev, note: '', repeat: false, repeatUntil: '' }));
        
    } catch (error) {
        console.error("Error adding block", error);
        alert("Erro ao adicionar bloqueio");
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Desbloquear este horário?')) return;
    setLoading(true);
    try {
        await fetch(`/api/slots/block?id=${id}`, { method: 'DELETE' });
        fetchExceptions();
    } catch (e) {
        alert("Erro ao excluir");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      
      <div className="flex flex-col xl:flex-row gap-8">
      {/* Left Column: Add New Exception */}
      <div className="w-full xl:w-1/3">
        <h1 className="text-2xl font-bold text-white mb-6">Bloqueios e Exceções</h1>
        
        <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 p-6 sticky top-6">
            <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                <span>🔒</span> Novo Bloqueio
            </h2>

            <form onSubmit={handleAdd} className="flex flex-col gap-4">
                {/* Date - Custom Calendar */}
                <div>
                    <label className="block text-sm text-slate-400 mb-3 flex items-center gap-2 font-bold uppercase tracking-wider"><CalendarIcon size={16} /> Data do Bloqueio</label>
                    <div className="flex justify-center bg-slate-800/30 rounded-2xl">
                        <Calendar 
                             selectedDate={form.date} 
                             onSelectDate={(d) => setForm({...form, date: d})} 
                             blockedDates={[]} 
                        />
                    </div>
                </div>

                {/* Time Range - Spinners */}
                <div className="flex gap-4">
                    <div className="w-1/2">
                        <label className="block text-sm text-slate-400 mb-2 flex items-center gap-1"><Clock size={16}/> Início</label>
                        <div className="flex items-center justify-center gap-2 bg-slate-800/50 rounded-xl p-2 border border-slate-700/50">
                            {/* Hour */}
                            <div className="flex flex-col items-center">
                                <button type="button" onClick={() => updateTime('start', 'hour', 1)} className="text-slate-400 hover:text-fuchsia-500 p-1"><ChevronUp size={16}/></button>
                                <span className="text-xl font-bold text-white">{form.start_time.split(':')[0]}</span>
                                <button type="button" onClick={() => updateTime('start', 'hour', -1)} className="text-slate-400 hover:text-fuchsia-500 p-1"><ChevronDown size={16}/></button>
                            </div>
                            <span className="text-slate-500 font-bold mb-1">:</span>
                            {/* Minute */}
                            <div className="flex flex-col items-center">
                                <button type="button" onClick={() => updateTime('start', 'minute', 5)} className="text-slate-400 hover:text-fuchsia-500 p-1"><ChevronUp size={16}/></button>
                                <span className="text-xl font-bold text-white">{form.start_time.split(':')[1]}</span>
                                <button type="button" onClick={() => updateTime('start', 'minute', -5)} className="text-slate-400 hover:text-fuchsia-500 p-1"><ChevronDown size={16}/></button>
                            </div>
                        </div>
                    </div>
                    <div className="w-1/2">
                        <label className="block text-sm text-slate-400 mb-2 flex items-center gap-1"><Clock size={16}/> Fim</label>
                        <div className="flex items-center justify-center gap-2 bg-slate-800/50 rounded-xl p-2 border border-slate-700/50">
                             {/* Hour */}
                            <div className="flex flex-col items-center">
                                <button type="button" onClick={() => updateTime('end', 'hour', 1)} className="text-slate-400 hover:text-fuchsia-500 p-1"><ChevronUp size={16}/></button>
                                <span className="text-xl font-bold text-white">{form.end_time.split(':')[0]}</span>
                                <button type="button" onClick={() => updateTime('end', 'hour', -1)} className="text-slate-400 hover:text-fuchsia-500 p-1"><ChevronDown size={16}/></button>
                            </div>
                            <span className="text-slate-500 font-bold mb-1">:</span>
                            {/* Minute */}
                            <div className="flex flex-col items-center">
                                <button type="button" onClick={() => updateTime('end', 'minute', 5)} className="text-slate-400 hover:text-fuchsia-500 p-1"><ChevronUp size={16}/></button>
                                <span className="text-xl font-bold text-white">{form.end_time.split(':')[1]}</span>
                                <button type="button" onClick={() => updateTime('end', 'minute', -5)} className="text-slate-400 hover:text-fuchsia-500 p-1"><ChevronDown size={16}/></button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Note */}
                <div>
                    <label className="block text-sm text-slate-400 mb-1">Motivo (Opcional)</label>
                    <input 
                        type="text" 
                        placeholder="Ex: Médico, Feriado..."
                        className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-xl outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20"
                        value={form.note}
                        onChange={e => setForm({...form, note: e.target.value})}
                    />
                </div>

                {/* Recurrence */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mt-2">
                    <div className="flex items-center justify-between mb-2">
                         <span className="text-sm font-bold text-slate-300">Repetir Bloqueio?</span>
                         <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={form.repeat} 
                                onChange={e => setForm({...form, repeat: e.target.checked})} 
                            />
                            <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-fuchsia-600"></div>
                        </label>
                    </div>
                    
                    {form.repeat && (
                        <div className="animate-in fade-in slide-in-from-top-1">
                             <label className="block text-xs text-slate-500 mb-1 mt-2">Repetir toda semana até:</label>
                             <input 
                                type="date" 
                                className="w-full p-2 bg-slate-800 border border-slate-700 text-white rounded-lg text-sm outline-none focus:border-fuchsia-500"
                                value={form.repeatUntil}
                                onChange={e => setForm({...form, repeatUntil: e.target.value})}
                                min={form.date} 
                                required
                            />
                        </div>
                    )}
                </div>

                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-fuchsia-600 text-white py-4 rounded-xl font-bold hover:bg-fuchsia-700 transition-colors shadow-lg shadow-fuchsia-900/40 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? 'Salvando...' : 'Bloquear Horário'}
                </button>
            </form>
        </div>
      </div>

      {/* Right Column: List of Exceptions */}
      <div className="w-full xl:w-2/3">
        <div className="flex justify-center mb-6">
            {/* Centered Date Picker */}
            <input 
                type="date"
                className="bg-slate-900 border border-slate-700 text-white text-lg font-bold rounded-xl p-3 outline-none focus:border-fuchsia-500 shadow-lg"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
            />
        </div>

        <div className="space-y-4">
            {loading ? (
                <div className="text-center py-10 text-slate-400">Carregando...</div>
            ) : exceptions.length === 0 ? (
                <div className="text-center py-20 bg-slate-900 rounded-2xl border border-slate-800 border-dashed">
                    <p className="text-slate-500">Nenhum bloqueio encontrado para esta data.</p>
                </div>
            ) : (
                exceptions.map((ex: any) => (
                    <div key={ex.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm hover:border-slate-700 transition-colors">
                        
                        <div className="flex items-center gap-4">
                            <div className="bg-red-900/20 w-12 h-12 rounded-xl flex items-center justify-center text-red-400 flex-shrink-0 border border-red-500/20">
                                🔒
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-200 capitalize">
                                    {/* Using formatDate helper and handling undefined */}
                                    {formatDate(ex.blocked_date || ex.date)}
                                </h3>
                                <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                                    <span className="flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded text-xs border border-slate-700">
                                        🕒 {ex.start_time?.slice(0, 5)} - {ex.end_time?.slice(0, 5)}
                                    </span>
                                    {ex.reason && <span>• {ex.reason}</span>}
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => handleDelete(ex.id)}
                            className="bg-red-900/10 text-red-400 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-900/30 transition-colors border border-red-900/20 w-full md:w-auto"
                        >
                            Desbloquear
                        </button>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
    </div>
  );
}
