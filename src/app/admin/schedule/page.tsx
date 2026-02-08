'use client';

import { useState, useEffect } from 'react';
import TimeSpinner from '@/app/components/TimeSpinner';

const DAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

export default function AdminSchedule() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [interval, setInterval] = useState(15);

  useEffect(() => {
    fetch('/api/settings/schedule')
      .then(res => res.json())
      .then(data => {
        const mapped = Array.from({ length: 7 }).map((_, i) => {
          const found = data.find((r: any) => r.day_of_week === i);
          return found || {
            day_of_week: i,
            start_time: '09:00:00',
            end_time: '18:00:00',
            lunch_start: '12:00:00',
            lunch_end: '13:00:00',
            is_active: i !== 0
          };
        });
        setRules(mapped);
      });

    fetch('/api/settings/interval')
      .then(res => res.json())
      .then(data => setInterval(Number(data.value || 15)))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (index: number, field: string, value: any) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    setRules(newRules);
  };

  const handleToggleLunch = (index: number) => {
    const rule = rules[index];
    const hasLunch = !!rule.lunch_start && !!rule.lunch_end;
    handleChange(index, 'lunch_start', hasLunch ? null : '12:00:00');
    handleChange(index, 'lunch_end', hasLunch ? null : '13:00:00');
  };

  const handleSave = async () => {
    setLoading(true);
    await fetch('/api/settings/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rules)
    });

    await fetch('/api/settings/interval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: interval })
    });

    setLoading(false);
    alert('Horários salvos com sucesso!');
  };

  if (loading && rules.length === 0) return <div>Carregando...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-md mx-auto min-h-screen flex flex-col">
        <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-900 px-6 py-4 pt-6 flex items-center justify-center">
          <h1 className="text-xl font-bold text-white">Horário de Funcionamento</h1>
        </header>

        <div className="px-4 pt-4 flex flex-col gap-4 pb-24">
          {rules.map((rule, i) => {
            const active = !!rule.is_active;
            const hasLunch = !!rule.lunch_start && !!rule.lunch_end;
            return (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">{DAYS[i]}</p>
                    <p className={`text-xs ${active ? 'text-fuchsia-400' : 'text-slate-500'}`}>
                      {active ? `${rule.start_time?.slice(0, 5)} - ${rule.end_time?.slice(0, 5)}` : 'Fechado'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleChange(i, 'is_active', !active)}
                    className={`w-12 h-7 rounded-full relative transition-colors border ${active ? 'bg-fuchsia-600 border-fuchsia-600' : 'bg-slate-800 border-slate-700'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${active ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {active && (
                  <div className="mt-4 flex flex-col gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Abertura</p>
                      <div className="flex items-center gap-2">
                        <TimeSpinner
                          value={rule.start_time?.slice(0, 5)}
                          disabled={!active}
                          onChange={val => handleChange(i, 'start_time', val)}
                        />
                        <span className="text-slate-500 text-xs">-</span>
                        <TimeSpinner
                          value={rule.end_time?.slice(0, 5)}
                          disabled={!active}
                          onChange={val => handleChange(i, 'end_time', val)}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Horário de Almoço</p>
                        <button
                          onClick={() => handleToggleLunch(i)}
                          className={`w-10 h-6 rounded-full relative transition-colors border ${hasLunch ? 'bg-fuchsia-600 border-fuchsia-600' : 'bg-slate-800 border-slate-700'}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${hasLunch ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </div>
                      {hasLunch && (
                        <div className="flex items-center gap-2">
                          <TimeSpinner
                            value={rule.lunch_start?.slice(0, 5)}
                            disabled={!active}
                            onChange={val => handleChange(i, 'lunch_start', val)}
                          />
                          <span className="text-slate-500 text-xs">-</span>
                          <TimeSpinner
                            value={rule.lunch_end?.slice(0, 5)}
                            disabled={!active}
                            onChange={val => handleChange(i, 'lunch_end', val)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-base">timer</span>
              Intervalo entre atendimentos
            </div>
            <p className="text-xs text-slate-400 mt-2">Defina um tempo de pausa automática após cada agendamento.</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              {[0, 10, 15, 30].map((m) => (
                <button
                  key={m}
                  onClick={() => setInterval(m)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold border ${interval === m ? 'bg-fuchsia-600 border-fuchsia-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
                >
                  {m === 0 ? 'Sem intervalo' : `${m} min`}
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Ajuste fino</p>
                <p className="text-xs text-slate-500">Personalizar duração (min)</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInterval((v) => Math.max(0, v - 5))}
                  className="size-8 rounded-lg bg-slate-800 border border-slate-700 text-white"
                >
                  −
                </button>
                <div className="min-w-[40px] text-center text-sm font-bold">{interval}</div>
                <button
                  onClick={() => setInterval((v) => v + 5)}
                  className="size-8 rounded-lg bg-slate-800 border border-slate-700 text-white"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-3.5 rounded-full shadow-lg shadow-fuchsia-600/30 disabled:opacity-60"
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}
