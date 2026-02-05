'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function BookingPage() {
    const [activeStep, setActiveStep] = useState(1);
    const [selectedProfessional, setSelectedProfessional] = useState<number | null>(1); // Default first
    const [selectedService, setSelectedService] = useState<string | null>('manicure');

    // Static Data mimicking the design
    const professionals = [
        { id: 1, name: 'Ana', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDd1tLdGJQCQuiuImeFfuvqyHTvrVqTQ2oCQ1S9H3rtOG5N6qNWi0OKyXmdLXX1j76FsBTwwhvwqUprFFpw4cDQZWjS4gDrer2UL5AkZHb8Y57nsubAnBRruxn6HzR3954yzmpX-9cZgotSxw1hFUWJLyckMyrFRVwG4JiPqySn-E5mqFxezgm5OSyQwiocetP_HqPHnBSEZhzCyLGnQQ7Pg2tIFYMZlvHpmTozvQt7A9l2H_PlFsfss9ztJNmVtfRwCCADZh8feL8' },
        { id: 2, name: 'Carla', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwK5nq0u8_yCIWuA21sXQ4f0AjaNGW4EIdGpHPKutbyw-cU1YYrVdDGQ553xkmlAW6v2pIa6a9RAAsQ8w0oVtR6CBaj9nvRcuLvR6CByD_JIf_qYzjlS0ibbVsr2thlfLOGzl6-YnDknrATobxnZGJPB-zfNa8YX2dquYOeHvzb5jqcV4uEe3Jd1yx1SKWOM4tvwWW6pL0v8oJHXCsqM8-UF-BBSP87wGgiEHcVKaTRJEBu_jN_JEOlcbKnhxfnmXYbqIuSAqE3Mk' },
        { id: 3, name: 'Julia', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYbgE5loxiT7kKurpO5zpVDWECsPKP3oYJ1LAC4E5QK_6fGJNE-a1hLM99cdC6uFaxiT-lVYjku4IyxtDw5o51UtxyhtizVqn9d1yahU-SgvIWau16ZmHPS_jUmOR3q_67H39M5Z0ogb5dQkq7-1OBMEK9Gyqqotd4D3OVZ3H2NQRDTNjB5RVW6HpCk36KwZkvjm4BUTLZGNxYz03W8uX6MxBolqr19CCmb1eM08xxgk8hFjjPrmHTdZg2Pb1yv8Klv2SPOfk4QfY' },
        { id: 4, name: 'Mari', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDt6Y7ueyIq-Y3AAj_2a8GPBLo95N2WTNJ7BtPEjDBdtjDSw1nfHJsKl0hZ4z3jli6cxvNhVMDfe_HsTWw6dXHBIW1F1Ygybuo4bCJGJ6kiphEe67hUXlUaBlIYcI_TnRe1yRK60DfY6vDo0lAY6EK0pwe4apEN2r_3wmvyHM_I5W0GLWAgPjZkpR0JhceNGajKNmtPp3oI2RKpqaX33Gmj0ZPdIQ7oVe4dV776r1YxOuH2e8rLAHVvPIp0lg5o03-bExnpdQPB75I' },
    ];

    const services = [
        { id: 'manicure', name: 'Manicure Completa', duration: '45 min', desc: 'Cuticulagem e Esmaltação', price: 45 },
        { id: 'pedicure', name: 'Pedicure Spa', duration: '60 min', desc: 'Hidratação e Massagem', price: 60 },
        { id: 'blindagem', name: 'Blindagem', duration: '90 min', desc: 'Gel reforçado', price: 120 },
    ];

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

                {/* Profile Header */}
                <div className="flex flex-col items-center pt-6 pb-4 px-6">
                    <div
                        className="bg-center bg-no-repeat bg-cover rounded-full size-24 shadow-sm border-4 border-white dark:border-[#2d1b24] mb-4"
                        style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuATrJ_hKdGcaxaEqr-Qr9MxavOrGYeF9b6vepJ8mrFjc8xXM9s-yvBpUlh7WoBEdNsKufERJgMXBORHT6AKW7gCAfNpYDb_3vEjuxgSCwhtH-ja8ieOdk6KNuOnrTyRtwHntO8OOZV0vdMPJo8b252XtATTlCWmDC0pJQMwMEv4yamBD-KTld95q4527c7XCZvjK1MMlWzsssJ7OIAvTgTtlcO2KydcP9w4DYvvtjkBzCKbdfprqMXvsTHjLpDaXJE75uKdZgJql1o")' }}
                    >
                    </div>
                    <h1 className="text-2xl font-bold text-center text-[#1b0d13] dark:text-white tracking-tight">Belleza Salon</h1>
                    <p className="text-[#ee2b7c] dark:text-[#ee2b7c]/90 text-sm font-medium mt-1 text-center">Manicure & Pedicure Premium</p>
                    <div className="flex gap-1 mt-2 items-center">
                        <span className="material-symbols-outlined text-yellow-500" style={{ fontSize: '16px' }}>star</span>
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">4.9 (128 avaliações)</span>
                    </div>
                </div>

                {/* Step 1: Escolha a Profissional */}
                <div className="flex flex-col w-full pb-6">
                    <div className="px-6 pb-3 pt-4 flex justify-between items-end">
                        <h3 className="text-[#1b0d13] dark:text-white text-xl font-bold leading-tight">1. Escolha a Profissional</h3>
                        <span className="text-xs text-[#ee2b7c] font-medium cursor-pointer">Ver todas</span>
                    </div>
                    <div className="flex overflow-x-auto pb-4 pt-2 px-6 gap-4 no-scrollbar snap-x" style={{ scrollbarWidth: 'none' }}>
                        {professionals.map(prof => (
                            <div
                                key={prof.id}
                                onClick={() => setSelectedProfessional(prof.id)}
                                className={`snap-center flex flex-col items-center gap-2 min-w-[80px] cursor-pointer group ${selectedProfessional !== prof.id ? 'opacity-70 hover:opacity-100' : ''} transition-all`}
                            >
                                <div className="relative p-1">
                                    {selectedProfessional === prof.id && (
                                        <div className="absolute inset-0 bg-[#ee2b7c] rounded-full opacity-100 blur-[1px]"></div>
                                    )}
                                    <div
                                        className={`bg-center bg-no-repeat bg-cover rounded-full size-16 border-2 relative z-10 transition-all duration-300 ${selectedProfessional === prof.id ? 'border-white dark:border-[#2d1b24]' : 'border-transparent grayscale hover:grayscale-0'}`}
                                        style={{ backgroundImage: `url("${prof.image}")` }}
                                    >
                                    </div>
                                    {selectedProfessional === prof.id && (
                                        <div className="absolute bottom-1 right-0 z-20 bg-[#ee2b7c] text-white rounded-full p-[2px] border border-white dark:border-[#2d1b24]">
                                            <span className="material-symbols-outlined block" style={{ fontSize: '12px' }}>check</span>
                                        </div>
                                    )}
                                </div>
                                <span className={`text-sm font-medium ${selectedProfessional === prof.id ? 'text-[#ee2b7c] font-bold' : 'text-gray-600 dark:text-gray-400'}`}>{prof.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-800 mx-6"></div>

                {/* Step 2: Escolha o Serviço */}
                <div className="flex flex-col w-full pb-6">
                    <h3 className="text-[#1b0d13] dark:text-white text-xl font-bold leading-tight px-6 pb-4 pt-6">2. Escolha o Serviço</h3>
                    <div className="flex flex-col gap-3 px-6">
                        {services.map(svc => (
                            <label
                                key={svc.id}
                                onClick={() => setSelectedService(svc.id)}
                                className={`group relative flex cursor-pointer rounded-2xl border bg-white dark:bg-[#2d1b24] p-4 shadow-sm transition-all hover:shadow-md ${selectedService === svc.id ? 'border-[#ee2b7c] ring-1 ring-[#ee2b7c]/10' : 'border-gray-100 dark:border-gray-800 hover:border-[#ee2b7c]/30'}`}
                            >
                                <input checked={selectedService === svc.id} readOnly className="peer sr-only" name="service" type="radio" />
                                <div className="flex flex-1 items-center justify-between">
                                    <div className="flex flex-col gap-1">
                                        <span className={`font-bold transition-colors ${selectedService === svc.id ? 'text-[#1b0d13] dark:text-white' : 'text-[#1b0d13] dark:text-white'}`}>{svc.name}</span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">{svc.duration} • {svc.desc}</span>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`font-bold text-lg ${selectedService === svc.id ? 'text-[#ee2b7c]' : 'text-[#1b0d13] dark:text-white'}`}>R$ {svc.price}</span>
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

                {/* Step 3: Data e Hora */}
                <div className="flex flex-col w-full pb-6">
                    <h3 className="text-[#1b0d13] dark:text-white text-xl font-bold leading-tight px-6 pb-4 pt-6">3. Escolha Data e Hora</h3>

                    {/* Date Carousel (Mock) */}
                    <div className="flex overflow-x-auto gap-3 px-6 pb-4 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
                        <div className="flex flex-col items-center justify-center min-w-[64px] h-[80px] rounded-2xl bg-[#ee2b7c] text-white shadow-soft cursor-pointer transform scale-105 transition-transform">
                            <span className="text-xs font-medium uppercase tracking-wide opacity-90">Hoje</span>
                            <span className="text-2xl font-bold">14</span>
                        </div>
                        {['15', '16', '17'].map((d, i) => (
                            <div key={d} className="flex flex-col items-center justify-center min-w-[64px] h-[80px] rounded-2xl bg-white dark:bg-[#2d1b24] border border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 cursor-pointer hover:border-[#ee2b7c]/50 transition-colors">
                                <span className="text-xs font-medium uppercase tracking-wide">{['Qui', 'Sex', 'Sáb'][i]}</span>
                                <span className="text-2xl font-bold text-[#1b0d13] dark:text-white">{d}</span>
                            </div>
                        ))}
                        <div className="flex flex-col items-center justify-center min-w-[64px] h-[80px] rounded-2xl bg-gray-50 dark:bg-white/5 border border-transparent text-gray-300 dark:text-gray-600 cursor-not-allowed">
                            <span className="text-xs font-medium uppercase tracking-wide">Dom</span>
                            <span className="text-2xl font-bold">18</span>
                        </div>
                    </div>

                    {/* Time Grid (Mock) */}
                    <div className="grid grid-cols-4 gap-3 px-6 mt-2">
                        <button className="py-2 px-1 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-400 dark:text-gray-500 line-through decoration-gray-400 cursor-not-allowed">09:00</button>
                        <button className="py-2 px-1 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-400 dark:text-gray-500 line-through decoration-gray-400 cursor-not-allowed">10:00</button>
                        <button className="py-2 px-1 rounded-lg bg-[#ee2b7c]/10 border border-[#ee2b7c] text-[#ee2b7c] text-sm font-bold shadow-sm hover:bg-[#ee2b7c]/20 transition-colors">11:00</button>
                        {['13:30', '14:30', '15:00', '16:00', '17:00'].map(t => (
                            <button key={t} className="py-2 px-1 rounded-lg bg-white dark:bg-[#2d1b24] border border-gray-200 dark:border-gray-700 text-[#1b0d13] dark:text-white text-sm font-medium hover:border-[#ee2b7c] hover:text-[#ee2b7c] transition-colors">{t}</button>
                        ))}
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
                                <input className="w-full bg-transparent border-none p-3 text-[#1b0d13] dark:text-white placeholder-gray-400 focus:ring-0 text-base" id="name" placeholder="Digite seu nome" type="text" />
                            </div>
                        </div>
                        <div className="group relative">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 ml-1" htmlFor="whatsapp">WhatsApp</label>
                            <div className="flex items-center rounded-xl bg-[#f8f6f7] dark:bg-[#221018] border border-gray-200 dark:border-gray-700 px-4 focus-within:border-[#ee2b7c] focus-within:ring-1 focus-within:ring-[#ee2b7c] transition-all">
                                <span className="material-symbols-outlined text-gray-400" style={{ fontSize: '20px' }}>chat</span>
                                <input className="w-full bg-transparent border-none p-3 text-[#1b0d13] dark:text-white placeholder-gray-400 focus:ring-0 text-base" id="whatsapp" placeholder="(00) 00000-0000" type="tel" />
                            </div>
                        </div>
                    </div>

                    {/* Sticky Bottom Action */}
                    <div className="mt-8">
                        <button className="w-full bg-[#ee2b7c] hover:bg-[#ee2b7c]/90 text-white font-bold text-lg py-4 rounded-xl shadow-soft transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                            Solicitar Agendamento
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_forward</span>
                        </button>
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
