'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function BookingPage() {
    const [procedures, setProcedures] = useState<any[]>([]);
    const [selectedService, setSelectedService] = useState<number | null>(null);
    const [form, setForm] = useState({ name: '', contact: '' });
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [slots, setSlots] = useState<{ time: string; available: boolean; reason?: string }[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState<{ date: string; time: string } | null>(null);

    useEffect(() => {
        fetch('/api/procedures')
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setProcedures(data);
                    if (data[0]?.id) setSelectedService(data[0].id);
                }
            });
    }, []);

    const formatDate = (d: Date) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const dayLabel = (d: Date) =>
        d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    const monthLabel = (d: Date) =>
        d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const shortDateLabel = (d: Date) =>
        d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    const dateCards = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return { date: formatDate(d), day: String(d.getDate()).padStart(2, '0'), label: dayLabel(d), monthTitle: monthLabel(d), short: shortDateLabel(d) };
    });

    useEffect(() => {
        if (!selectedService || !date) return;
        setLoadingSlots(true);
        setSlots([]);
        setTime('');
        fetch(`/api/slots/available?date=${date}&procedureId=${selectedService}`)
            .then((res) => res.json())
            .then((data) => setSlots(data.slots || []))
            .finally(() => setLoadingSlots(false));
    }, [selectedService, date]);

    const handleSubmit = async () => {
        setError('');
        if (!selectedService || !form.name || !form.contact || !date || !time) {
            setError('Preencha seus dados, selecione um serviço, dia e horário.');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/leads/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    contact: form.contact,
                    date,
                    time,
                    procedure_id: selectedService
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro ao solicitar');
            setSuccess({ date, time });
        } catch (err: any) {
            setError(err.message || 'Erro ao solicitar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#f8f6f7] dark:bg-[#221018] font-sans text-[#1b0d13] dark:text-gray-100 min-h-screen">
            {/* Styles for Icons */}
            <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

            <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto shadow-2xl bg-[#f8f6f7] dark:bg-[#221018]">

                {/* Top App Bar */}
                <div className="sticky top-0 z-50 bg-[#f8f6f7]/80 dark:bg-[#221018]/80 backdrop-blur-md p-4 pb-2 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                        <Link href="/">
                            <button className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                                <span className="material-symbols-outlined text-[#1b0d13] dark:text-white" style={{ fontSize: '24px' }}>arrow_back</span>
                            </button>
                        </Link>
                        <h2 className="text-[#1b0d13] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Agendamento Online</h2>
                        <div className="flex w-10 items-center justify-end">
                            <button className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                                <span className="material-symbols-outlined text-[#1b0d13] dark:text-white" style={{ fontSize: '24px' }}>share</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Step 2: Escolha o Serviço */}
                <div className="flex flex-col w-full pb-6">
                    <h3 className="text-[#1b0d13] dark:text-white text-xl font-bold leading-tight px-6 pb-4 pt-6">Escolha o Serviço</h3>
                    <div className="flex flex-col gap-3 px-6">
                        {procedures.map((svc) => (
                            <label
                                key={svc.id}
                                onClick={() => setSelectedService(svc.id)}
                                className={`group relative flex cursor-pointer rounded-2xl border bg-white dark:bg-[#2d1b24] p-4 shadow-sm transition-all hover:shadow-md ${selectedService === svc.id ? 'border-[#ee2b7c] ring-1 ring-[#ee2b7c]/10' : 'border-gray-100 dark:border-gray-800 hover:border-[#ee2b7c]/30'}`}
                            >
                                <input checked={selectedService === svc.id} readOnly className="peer sr-only" name="service" type="radio" />
                                <div className="flex flex-1 items-center justify-between">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-bold transition-colors text-[#1b0d13] dark:text-white">{svc.name}</span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            {svc.duration_minutes} min
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`font-bold text-lg ${selectedService === svc.id ? 'text-[#ee2b7c]' : 'text-[#1b0d13] dark:text-white'}`}>R$ {Number(svc.price).toFixed(2)}</span>
                                        <div className={`size-6 rounded-full border-2 flex items-center justify-center ${selectedService === svc.id ? 'border-[#ee2b7c] bg-[#ee2b7c]' : 'border-gray-200 dark:border-gray-600 bg-transparent'}`}>
                                            {selectedService === svc.id && <div className="size-2.5 rounded-full bg-white"></div>}
                                        </div>
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-800 mx-6"></div>

                {/* Data e Hora */}
                <div className="flex flex-col w-full pb-6">
                    <div className="px-6 pb-2 pt-6 flex items-center justify-between">
                        <h3 className="text-[#1b0d13] dark:text-white text-xl font-bold leading-tight">Data e Hora</h3>
                        <span className="text-xs text-[#ee2b7c] font-medium">{dateCards[0]?.monthTitle}</span>
                    </div>
                    <div className="flex overflow-x-auto gap-3 px-6 pb-2 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
                        {dateCards.map((d) => (
                            <button
                                key={d.date}
                                type="button"
                                onClick={() => setDate(d.date)}
                                className={`min-w-[58px] h-[72px] rounded-2xl border text-center flex flex-col items-center justify-center transition-all ${
                                    date === d.date
                                        ? 'bg-[#ee2b7c] text-white border-[#ee2b7c] shadow-md'
                                        : 'bg-white dark:bg-[#2d1b24] text-[#1b0d13] dark:text-white border-gray-200 dark:border-gray-700'
                                }`}
                            >
                                <span className="text-[11px] uppercase tracking-wide opacity-80">{d.label}</span>
                                <span className="text-xl font-bold">{d.day}</span>
                            </button>
                        ))}
                    </div>

                    <div className="px-6 mt-3">
                        {loadingSlots && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">Carregando horários...</div>
                        )}
                        {!loadingSlots && slots.length === 0 && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">Selecione uma data para ver os horários disponíveis.</div>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                            {slots.map((s) => (
                                <button
                                    key={s.time}
                                    type="button"
                                    disabled={!s.available}
                                    onClick={() => s.available && setTime(s.time)}
                                    className={`min-w-[64px] px-3 py-2 rounded-full text-xs font-semibold border transition-colors ${
                                        s.available
                                            ? time === s.time
                                                ? 'bg-[#ee2b7c] border-[#ee2b7c] text-white shadow-sm'
                                                : 'bg-white dark:bg-[#2d1b24] border-[#e7cfd9] dark:border-[#5e3a4b] text-[#1b0d13] dark:text-white hover:border-[#ee2b7c]'
                                            : 'border-[#e7cfd9] dark:border-[#5e3a4b] text-gray-400 dark:text-gray-500 line-through cursor-not-allowed bg-transparent'
                                    }`}
                                >
                                    {s.time}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="px-6 mt-4">
                        <div className="rounded-2xl border border-[#e7cfd9] dark:border-[#5e3a4b] bg-white dark:bg-[#2d1b24] p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Total estimado</p>
                                <p className="text-lg font-bold text-[#1b0d13] dark:text-white">
                                    R$ {selectedService ? Number(procedures.find((p) => p.id === selectedService)?.price || 0).toFixed(2) : '0,00'}
                                </p>
                            </div>
                            <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                                {date && time ? (
                                    <>
                                        <p>{shortDateLabel(new Date(date + 'T12:00:00'))}</p>
                                        <p>{time}</p>
                                    </>
                                ) : (
                                    <p>Selecione data e hora</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Section */}
                <div className="bg-white dark:bg-[#2d1b24] mt-4 rounded-t-3xl shadow-[0_-4px_20px_-2px_rgba(0,0,0,0.05)] border-t border-gray-100 dark:border-gray-800 p-6 pb-8">
                    <h3 className="text-[#1b0d13] dark:text-white text-lg font-bold mb-4">Seus Dados</h3>
                    <div className="space-y-4">
                        <div className="group relative">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 ml-1" htmlFor="name">Nome Completo</label>
                            <div className="flex items-center rounded-xl bg-[#f8f6f7] dark:bg-[#221018] border border-gray-200 dark:border-gray-700 px-4 focus-within:border-[#ee2b7c] focus-within:ring-1 focus-within:ring-[#ee2b7c] transition-all">
                                <span className="material-symbols-outlined text-gray-400" style={{ fontSize: '20px' }}>person</span>
                                <input
                                    className="w-full bg-transparent border-none p-3 text-[#1b0d13] dark:text-white placeholder-gray-400 focus:ring-0 text-base"
                                    id="name"
                                    placeholder="Digite seu nome"
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="group relative">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 ml-1" htmlFor="whatsapp">WhatsApp</label>
                            <div className="flex items-center rounded-xl bg-[#f8f6f7] dark:bg-[#221018] border border-gray-200 dark:border-gray-700 px-4 focus-within:border-[#ee2b7c] focus-within:ring-1 focus-within:ring-[#ee2b7c] transition-all">
                                <span className="material-symbols-outlined text-gray-400" style={{ fontSize: '20px' }}>chat</span>
                                <input
                                    className="w-full bg-transparent border-none p-3 text-[#1b0d13] dark:text-white placeholder-gray-400 focus:ring-0 text-base"
                                    id="whatsapp"
                                    placeholder="(00) 00000-0000"
                                    type="tel"
                                    value={form.contact}
                                    onChange={(e) => setForm({ ...form, contact: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sticky Bottom Action */}
                    <div className="mt-8">
                        {error && (
                            <p className="text-sm text-red-500 mb-3 text-center">{error}</p>
                        )}
                        {success ? (
                            <div className="text-center text-sm text-gray-600 dark:text-gray-300 mb-3">
                                Solicitação enviada! Vamos confirmar via WhatsApp.
                            </div>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full bg-[#ee2b7c] hover:bg-[#ee2b7c]/90 text-white font-bold text-lg py-4 rounded-xl shadow-soft transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {loading ? 'Enviando...' : 'Solicitar Agendamento'}
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_forward</span>
                            </button>
                        )}
                        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3 flex items-center justify-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">info</span>
                            Aguarde a confirmação da profissional pelo WhatsApp
                        </p>
                    </div>
                </div>
                <div className="h-6 bg-white dark:bg-[#2d1b24]"></div>
            </div>
        </div>
    );
}
