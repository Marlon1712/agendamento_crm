'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function BookingPage() {
    const router = useRouter();
    const [procedures, setProcedures] = useState<any[]>([]);
    const [selectedService, setSelectedService] = useState<number | null>(null);
    const [form, setForm] = useState({ name: '', contact: '', cpf: '' });
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
        if (!selectedService || !form.name || !form.contact || !form.cpf || !date || !time) {
            setError('Preencha seus dados, selecione um serviço, dia e horário.');
            return;
        }
        const onlyDigits = (v: string) => v.replace(/\D/g, '');
        const isValidCpf = (value: string) => {
            const digits = onlyDigits(value);
            if (digits.length !== 11) return false;
            if (/^(\d)\1{10}$/.test(digits)) return false;
            const calc = (factor: number) => {
                let total = 0;
                for (let i = 0; i < factor - 1; i++) {
                    total += Number(digits[i]) * (factor - i);
                }
                const rest = (total * 10) % 11;
                return rest === 10 ? 0 : rest;
            };
            const d1 = calc(10);
            const d2 = calc(11);
            return d1 === Number(digits[9]) && d2 === Number(digits[10]);
        };
        if (!isValidCpf(form.cpf)) {
            setError('CPF inválido.');
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
                    cpf: form.cpf,
                    date,
                    time,
                    procedure_id: selectedService
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro ao solicitar');
            setSuccess({ date, time });
            setTimeout(() => {
                router.push('/');
            }, 800);
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

        <div className="agendar-page relative flex min-h-screen w-full flex-col max-w-md mx-auto shadow-2xl bg-[#f8f6f7] dark:bg-[#221018]">

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
                                    autoComplete="off"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="group relative">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 ml-1" htmlFor="whatsapp">WhatsApp</label>
                            <div className="flex items-center rounded-xl bg-[#f8f6f7] dark:bg-[#221018] border border-gray-200 dark:border-gray-700 px-4 focus-within:border-[#ee2b7c] focus-within:ring-1 focus-within:ring-[#ee2b7c] transition-all">
                                <svg aria-hidden="true" viewBox="0 0 32 32" className="h-5 w-5 text-gray-400 fill-current">
                                    <path d="M19.11 17.45c-.27-.13-1.6-.79-1.85-.88-.25-.09-.43-.13-.6.13-.17.27-.69.88-.85 1.06-.16.18-.31.2-.58.07-.27-.13-1.13-.42-2.15-1.33-.79-.7-1.32-1.57-1.47-1.83-.15-.27-.02-.41.11-.55.12-.12.27-.31.4-.46.13-.15.18-.27.27-.45.09-.18.04-.34-.02-.47-.07-.13-.6-1.45-.82-1.98-.22-.52-.44-.45-.6-.46h-.51c-.18 0-.47.07-.71.34-.24.27-.93.91-.93 2.22 0 1.31.96 2.57 1.09 2.75.13.18 1.89 2.88 4.58 4.04.64.28 1.14.45 1.53.58.64.2 1.22.17 1.68.1.51-.08 1.6-.65 1.82-1.28.23-.63.23-1.17.16-1.28-.07-.11-.25-.18-.52-.31zM16.01 5.33c-5.84 0-10.58 4.53-10.58 10.12 0 1.79.49 3.54 1.43 5.07L5 27l6.79-1.9c1.49.8 3.18 1.22 4.92 1.22 5.84 0 10.58-4.53 10.58-10.12 0-2.69-1.11-5.23-3.13-7.13-2.01-1.9-4.69-2.94-7.15-2.94zm0 19.04c-1.58 0-3.13-.41-4.47-1.17l-.32-.18-4.03 1.13 1.1-3.75-.21-.34c-.87-1.41-1.33-3.02-1.33-4.66 0-4.74 4.05-8.59 9.05-8.59 2.41 0 4.67.93 6.38 2.54 1.71 1.61 2.65 3.75 2.65 6.05 0 4.74-4.05 8.59-9.05 8.59z"/>
                                </svg>
                                <input
                                    className="w-full bg-transparent border-none p-3 text-[#1b0d13] dark:text-white placeholder-gray-400 focus:ring-0 text-base appearance-none"
                                    id="whatsapp"
                                    placeholder="(00) 00000-0000"
                                    type="tel"
                                    inputMode="tel"
                                    autoComplete="off"
                                    value={form.contact}
                                    onChange={(e) => {
                                        let v = e.target.value.replace(/\D/g, '');
                                        if (v.length > 11) v = v.slice(0, 11);
                                        if (v.length > 0) {
                                            v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
                                            v = v.replace(/(\d)(\d{4})$/, '$1-$2');
                                        }
                                        setForm({ ...form, contact: v });
                                    }}
                                />
                            </div>
                        </div>
                        <div className="group relative">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 ml-1" htmlFor="cpf">CPF</label>
                            <div className="flex items-center rounded-xl bg-[#f8f6f7] dark:bg-[#221018] border border-gray-200 dark:border-gray-700 px-4 focus-within:border-[#ee2b7c] focus-within:ring-1 focus-within:ring-[#ee2b7c] transition-all">
                                <span className="material-symbols-outlined text-gray-400" style={{ fontSize: '20px' }}>badge</span>
                                <input
                                    className="w-full bg-transparent border-none p-3 text-[#1b0d13] dark:text-white placeholder-gray-400 focus:ring-0 text-base"
                                    id="cpf"
                                    placeholder="000.000.000-00"
                                    type="text"
                                    autoComplete="off"
                                    value={form.cpf}
                                    onChange={(e) => {
                                        let v = e.target.value.replace(/\D/g, '').slice(0, 11);
                                        const p1 = v.slice(0, 3);
                                        const p2 = v.slice(3, 6);
                                        const p3 = v.slice(6, 9);
                                        const p4 = v.slice(9, 11);
                                        v = v.length <= 3 ? p1 : v.length <= 6 ? `${p1}.${p2}` : v.length <= 9 ? `${p1}.${p2}.${p3}` : `${p1}.${p2}.${p3}-${p4}`;
                                        setForm({ ...form, cpf: v });
                                    }}
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
