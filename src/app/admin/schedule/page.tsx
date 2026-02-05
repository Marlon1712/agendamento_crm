'use client';

import { useState, useEffect } from 'react';
import { Sun, Coffee, Save } from 'lucide-react';
import TimeSpinner from '@/app/components/TimeSpinner';

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function AdminSchedule() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings/schedule')
      .then(res => res.json())
      .then(data => {
        // Map db rows to full array 0-6
        const mapped = Array.from({ length: 7 }).map((_, i) => {
            const found = data.find((r: any) => r.day_of_week === i);
            return found || { day_of_week: i, start_time: '09:00:00', end_time: '18:00:00', is_active: false };
        });
        setRules(mapped);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (index: number, field: string, value: any) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    setRules(newRules);
  };

  const handleSave = async () => {
    setLoading(true);
    await fetch('/api/settings/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rules)
    });
    setLoading(false);
    alert('Horários salvos com sucesso!');
  };

  if (loading && rules.length === 0) return <div>Carregando...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Horários de Atendimento</h1>
      
      <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 overflow-hidden">
        {rules.map((rule, i) => (
            <div key={i} className={`p-4 flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 last:border-0 gap-4 ${!rule.is_active ? 'bg-slate-950/50 opacity-60' : ''}`}>
                <div className="flex items-center space-x-4 w-full md:w-32">
                    <div 
                        onClick={() => handleChange(i, 'is_active', !rule.is_active)}
                        className={`w-12 h-7 rounded-full relative transition-colors cursor-pointer border-2 ${rule.is_active ? 'bg-fuchsia-600 border-fuchsia-600' : 'bg-slate-800 border-slate-700'}`}
                    >
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${rule.is_active ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </div>
                    <span className={`font-medium transition-colors ${rule.is_active ? 'text-white' : 'text-slate-500'}`}>{DAYS[i]}</span>
                </div>
                
                <div className="flex flex-row items-center justify-between md:justify-start gap-4 md:gap-8 w-full">
                    {/* Working Hours */}
                    <div className="flex flex-col items-center gap-1 min-w-fit">
                        <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1 justify-center"><Sun size={12} /> Expediente</span>
                        <div className="flex items-center gap-1">
                            <TimeSpinner 
                                value={rule.start_time?.slice(0, 5)}
                                disabled={!rule.is_active}
                                onChange={val => handleChange(i, 'start_time', val)}
                            />
                            <span className="text-slate-600 font-bold text-xs">-</span>
                            <TimeSpinner 
                                value={rule.end_time?.slice(0, 5)}
                                disabled={!rule.is_active}
                                onChange={val => handleChange(i, 'end_time', val)}
                            />
                        </div>
                    </div>

                    <div className="h-8 w-px bg-slate-800 hidden md:block"></div>

                    {/* Lunch Break */}
                    <div className="flex flex-col items-center gap-1 min-w-fit">
                        <span className="text-[10px] text-fuchsia-400 uppercase font-bold flex items-center gap-1 justify-center"><Coffee size={12} /> Almoço</span>
                        <div className="flex items-center gap-1">
                            <TimeSpinner 
                                value={rule.lunch_start?.slice(0, 5) || '12:00'}
                                disabled={!rule.is_active}
                                onChange={val => handleChange(i, 'lunch_start', val)}
                            />
                            <span className="text-slate-600 font-bold text-xs">-</span>
                            <TimeSpinner 
                                value={rule.lunch_end?.slice(0, 5) || '13:00'}
                                disabled={!rule.is_active}
                                onChange={val => handleChange(i, 'lunch_end', val)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <button 
            onClick={handleSave}
            disabled={loading}
            className="bg-fuchsia-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-fuchsia-700 transition-colors shadow-lg shadow-fuchsia-900/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
            <Save size={20} />
            {loading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </div>
  );
}
