'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Calendar from './Calendar';

type Procedure = {
  id: number;
  name: string;
  duration_minutes: number;
  price: string;
  is_promotional: number; // 0 or 1
  promo_price: string;
  promo_end_date: string | null;
  promo_start_date: string | null;
  description?: string;
  observation?: string; 
  promo_type?: 'discount' | 'combo' | 'gift'; 
  promo_gift_item?: string; 
};

// HELPER: Safe Date Validation
const isValidDate = (d: any) => {
    return d instanceof Date && !isNaN(d.getTime());
};

// HELPER: Safe Price Parsing
const safeFloat = (val: any) => {
    if (val === null || val === undefined) return 0;
    const f = parseFloat(val);
    return isNaN(f) ? 0 : f;
};

export default function BookingWizard() {
  const [step, setStep] = useState(0); // 0: Service, 1: Date, 2: Time, 3: Form
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
  const [expandedProcedureId, setExpandedProcedureId] = useState<number | null>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [promoAvailability, setPromoAvailability] = useState<Record<number, number>>({});
  const [calendarStatus, setCalendarStatus] = useState<{closedDays: number[], blockedBlocks: any[]}>({ closedDays: [], blockedBlocks: [] });
  const scrollRef = useRef<HTMLDivElement>(null);

  // Track active card index on scroll
  const handleScroll = () => {
    if (scrollRef.current) {
        const container = scrollRef.current;
        const scrollLeft = container.scrollLeft;
        const cardWidth = 280; // approx width + gap
        const index = Math.round(scrollLeft / cardWidth);
        setActiveCardIndex(index);
    }
  };

  // Removed auto-expansion effect to keep cards collapsed by default
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<{time: string, available: boolean, reason?: string}[]>([]);
  const [bookingSummary, setBookingSummary] = useState<any>(null); // To store backend summary (reason for full day etc)
  const [time, setTime] = useState('');
  const [form, setForm] = useState({ name: '', contact: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-fill from Session
  const { data: session } = useSession();
  useEffect(() => {
    if (session?.user) {
        const user = session.user;
        setForm(prev => ({
            ...prev,
            name: user.name || prev.name,
            contact: (user as any).phone || prev.contact
        }));
    }
  }, [session]);

  // Fetch Procedures on mount
  // Fetch Procedures & Promo Availability on mount
  useEffect(() => {
    fetch('/api/procedures')
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data)) setProcedures(data);
      });

    fetch('/api/promotions/availability')
        .then(res => res.json())
        .then(data => setPromoAvailability(data))
        .catch(err => console.error("Failed to fetch promo stats", err));

    // Fetch Calendar Rules (Closed days etc)
    fetch('/api/calendar/status')
        .then(res => res.json())
        .then(data => setCalendarStatus(data))
        .catch(err => console.error("Failed to fetch calendar status", err));
  }, []);

  // Helpers
  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => {
    setError('');
    setStep(s => s - 1);
  };

  const selectProcedure = (proc: any) => {
    setSelectedProcedure(proc);
    nextStep();
  };

  // Fetch slots
  useEffect(() => {
    if (date && selectedProcedure) {
      setLoading(true);
      setError('');
      setSlots([]); // reset
      setBookingSummary(null);

      fetch(`/api/slots/available?date=${date}&procedureId=${selectedProcedure.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) throw new Error(data.error);
          setSlots(data.slots || []);
          setBookingSummary(data.summary);
        })
        .catch(err => {
            console.error(err);
            setSlots([]);
        })
        .finally(() => setLoading(false));
    }
  }, [date, selectedProcedure]);

  const handleBooking = async () => {
    if (!selectedProcedure) return; // Should not happen given the flow, but fixes TS error
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/leads/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            ...form, 
            date, 
            time, 
            procedure_id: selectedProcedure.id 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao agendar');
      
      setStep(4); // Success
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 4) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-lg mx-auto border border-white/50 backdrop-blur-sm animate-fade-in-up">
        <div className="text-6xl mb-6">🕒</div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Solicitação Enviada!</h2>
        <p className="text-gray-600 mb-8 text-lg">
          Obrigado, <strong className="text-fuchsia-600">{form.name}</strong>. 
          <br/>
          Sua solicitação para <strong>{selectedProcedure?.name}</strong> em <strong>{date.split('-').reverse().join('/')}</strong> às <strong>{time}</strong> foi recebida.
          <br/>
          <span className="text-sm mt-2 block text-gray-500">Aguarde contato confirmando o agendamento.</span>
        </p>
        <button 
            className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-3 px-8 rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-fuchsia-500/30"
            onClick={() => window.location.reload()}
        >
          Solicitar Outro
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[500px] flex flex-col justify-center w-full">
      
      {/* Step 0: Service Selection */}
      {step === 0 && (
         <div className="animate-fade-in w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">Escolha o Procedimento</h3>
            <p className="text-gray-500 text-center mb-8">Selecione o serviço que deseja realizar</p>
            
            {/* Pagination Dots (Top) */}
            <div className="flex justify-center gap-2 mb-6">
                {procedures.map((proc, i) => {
                    const isPromo = !!proc.is_promotional && (!proc.promo_end_date || new Date(proc.promo_end_date) > new Date());
                    const isActive = i === activeCardIndex;
                    
                    let dotClass = 'h-2 rounded-full transition-all duration-300 ';
                    if (isActive) {
                        dotClass += 'w-6 ';
                        dotClass += isPromo ? 'bg-orange-500' : 'bg-gray-800';
                    } else {
                        dotClass += 'w-2 bg-gray-300';
                    }

                    return (
                        <div key={i} className={dotClass} />
                    );
                })}
            </div>
            
            <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex flex-row overflow-x-auto snap-x snap-mandatory gap-4 pb-2 pt-2 px-4 w-full no-scrollbar items-start" 
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {procedures.map((proc: any) => {
                    const now = new Date();
                    // Basic Promo Validity (Date + Flag)
                    const nowTS = now.getTime();
                    const startRaw = proc.promo_start_date ? new Date(proc.promo_start_date) : null;
                    const endRaw = proc.promo_end_date ? new Date(proc.promo_end_date) : null;
                    
                    // Expired? If has end date and end date < now - 24 hours (grace? No, strict per logic)
                    // Logic: If promo_end_date is passed, visually it should disappear or be standard. USER said: "expirado apos um dia esse card seja deletado"
                    const isExpired = endRaw && isValidDate(endRaw) && (endRaw.getTime() + 86400000) < nowTS;
                    if(isExpired && proc.is_promotional) return null; // Filter out expired promos entirely

                    const startsInFuture = startRaw && isValidDate(startRaw) && startRaw.getTime() > nowTS;

                    // Active check
                    const isPromoPeriod = !!proc.is_promotional && 
                        (!startRaw || !isValidDate(startRaw) || startRaw.getTime() <= nowTS) &&
                        (!endRaw || !isValidDate(endRaw) || endRaw.getTime() >= nowTS);
                        
                    // Vacancy logic
                    const vacancy = promoAvailability[proc.id];
                    const hasVacancy = vacancy === undefined || vacancy > 0;
                    
                    // Classification
                    const promoType = proc.promo_type || 'discount';
                    const isGift = promoType === 'gift';
                    const isCombo = promoType === 'combo';

                    // States
                    const isFuture = !!startsInFuture && !!proc.is_promotional;
                    const isActive = isPromoPeriod && hasVacancy && !isFuture;
                    const isSoldOut = isPromoPeriod && !hasVacancy && vacancy !== undefined;

                    // Interaction Logic
                    const isDisabled = isFuture || (isSoldOut && isGift);
                    
                    // Reuse expandedProcedureId for description toggle
                    const showDesc = expandedProcedureId === proc.id;

                    // Countdown Helper
                    const getDaysToStart = () => {
                         if(!startRaw || !isValidDate(startRaw)) return 0;
                         const diff = startRaw.getTime() - nowTS;
                         return Math.ceil(diff / (1000 * 60 * 60 * 24));
                    }
                    
                    return (
                        <div 
                            key={proc.id}
                            onClick={() => {
                                if(isDisabled) return;
                                setExpandedProcedureId(showDesc ? null : proc.id);
                                setSelectedProcedure(proc);
                            }}
                            className={`
                                snap-center shrink-0 relative rounded-2xl flex flex-col overflow-hidden transition-all duration-300 cursor-pointer
                                w-[290px] md:w-[350px] border shadow-md hover:shadow-xl hover:-translate-y-1
                                ${selectedProcedure?.id === proc.id 
                                    ? isGift ? 'ring-2 ring-purple-600'
                                    : isCombo ? 'ring-2 ring-blue-600'
                                    : isActive ? 'ring-2 ring-orange-500'
                                    : 'ring-2 ring-gray-900'
                                    : ''}
                                ${isDisabled ? 'bg-gray-100 border-gray-200 grayscale opacity-80' : 
                                   isActive ? 'bg-white border-orange-200' : 'bg-white border-gray-100'}
                            `}
                        >
                             {/* Badges */}
                            {isFuture && (
                                <div className="absolute top-0 right-0 z-20 flex flex-col items-end">
                                    <div className="bg-gray-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-sm">
                                        Em Breve
                                    </div>
                                </div>
                            )}

                            {isActive && (
                                <div className="absolute top-0 right-0 z-20 flex flex-col items-end">
                                    <div className={`${isGift ? 'bg-purple-600' : isCombo ? 'bg-blue-600' : 'bg-orange-500'} text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-sm`}>
                                        {isGift ? 'BRINDE 🎁' : isCombo ? 'COMBO ✨' : 'OFERTA 🔥'}
                                    </div>
                                    {vacancy !== undefined && (
                                        <div className={`bg-${isGift ? 'purple' : isCombo ? 'blue' : 'orange'}-50 text-${isGift ? 'purple' : isCombo ? 'blue' : 'orange'}-700 text-[9px] font-bold px-2 py-0.5 rounded-bl-lg border-l border-b border-gray-100 shadow-sm mt-0.5`}>
                                            {vacancy} vagas
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {isSoldOut && (
                                 <div className="absolute top-0 right-0 z-20 flex flex-col items-end">
                                    <div className="bg-gray-800 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-sm">
                                        Esgotado
                                    </div>
                                </div>
                            )}

                            <div className="p-5 flex flex-col h-full pb-16 relative">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className={`font-bold text-lg md:text-xl leading-tight w-full ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                                        {proc.name}
                                    </h4>
                                </div>
                                
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-500 font-medium flex items-center gap-1">
                                        ⏱️ {proc.duration_minutes} min
                                    </span>
                                    <button
                                        className={`relative p-1.5 rounded-full transition-all duration-300 
                                            ${showDesc 
                                                ? 'rotate-180 text-gray-300 hover:text-gray-500' // Discreet when open
                                                : isActive 
                                                    ? 'text-orange-500 hover:bg-orange-50' 
                                                    : isDisabled ? 'text-gray-300' : 'text-gray-400 hover:bg-gray-100'
                                            }
                                        `}
                                        title={showDesc ? "Ocultar detalhes" : "Ver detalhes"}
                                    >
                                        <svg className={`relative z-10 ${!showDesc && 'animate-pulse-scale'}`} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                    </button>
                                </div>

                                {/* Description Toggle */}
                                <div className={`overflow-hidden transition-all duration-300 ${showDesc ? 'max-h-60 opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
                                    <p className="text-sm text-gray-600 leading-relaxed font-sans mb-2">
                                        {proc.description || "Toque para selecionar."}
                                    </p>
                                    {proc.observation && (
                                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 rounded-r text-xs text-yellow-800 italic">
                                            <strong>Nota:</strong> {proc.observation}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-auto">
                                    <div className="flex flex-col mb-1">
                                        {isFuture ? (
                                            <div className="text-center bg-gray-200 rounded p-2">
                                                <p className="text-xs text-gray-500 font-bold uppercase">Inicia em</p>
                                                <p className="text-lg font-bold text-gray-700">{getDaysToStart()} dias</p>
                                                <p className="text-[10px] text-gray-400">{isValidDate(startRaw) ? startRaw?.toLocaleDateString('pt-BR') : ''}</p>
                                            </div>
                                        ) : isActive ? (
                                            <>
                                                {/* Pricing Logic */}
                                                {isGift ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-2xl font-bold text-purple-700">R$ {safeFloat(proc.price).toFixed(2)}</span>
                                                        <div className="flex items-center gap-1 mt-1 animate-bounce-small">
                                                            <span className="text-xs bg-purple-100 text-purple-700 font-bold px-2 py-1 rounded border border-purple-200">
                                                                + {proc.promo_gift_item || 'Brinde Surpresa'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                     /* Discount or Combo */
                                                    <>
                                                        <span className="text-xs text-gray-400 line-through">R$ {safeFloat(proc.price).toFixed(2)}</span>
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-2xl font-bold ${isCombo ? 'text-blue-600' : 'text-orange-600'}`}>
                                                                    R$ {safeFloat(proc.promo_price).toFixed(2)}
                                                                </span>
                                                                <span className={`text-xs px-2 py-0.5 rounded font-bold border ${isCombo ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
                                                                    -{Math.round((1 - safeFloat(proc.promo_price)/safeFloat(proc.price)) * 100)}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                                
                                                <div className="flex flex-col text-[10px] text-gray-400 font-medium mt-1">
                                                    {proc.promo_end_date && isValidDate(new Date(proc.promo_end_date)) && (
                                                        <span>Expira em: {new Date(proc.promo_end_date).toLocaleDateString('pt-BR')}</span>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            /* Standard or Sold Out (Non-Gift) */
                                            <div className="flex flex-col">
                                                {isSoldOut && <span className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-wide">Preço Normal</span>}
                                                <span className={`text-2xl font-bold ${isDisabled ? 'text-gray-400' : 'text-gray-800'}`}>
                                                    R$ {safeFloat(proc.price).toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Full Width Footer Button */}
                            <button
                                disabled={isDisabled}
                                onClick={(e) => {
                                    e.stopPropagation(); 
                                    if(isDisabled) return;
                                    setSelectedProcedure(proc);
                                    nextStep();
                                }}
                                className={`absolute bottom-0 left-0 w-full py-3 font-bold text-sm tracking-widest uppercase transition-all
                                    ${isDisabled
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : isActive 
                                                ? isGift ? 'bg-purple-600 text-white hover:bg-purple-700' 
                                                  : isCombo ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                  : 'bg-orange-500 text-white hover:bg-orange-600' 
                                                : 'bg-gray-900 text-white hover:bg-black'}
                                `}
                            >
                                {isFuture ? 'Aguarde' : isSoldOut && isGift ? 'Esgotado' : selectedProcedure?.id === proc.id ? 'Selecionado' : 'Agendar Agora'}
                            </button>
                        </div>
                    );
                })}{/* Spacer */}
                <div className="w-4 shrink-0"></div>
            </div>
            


            <div className="hidden">
                 {/* Removing the old spacers or hidden elements if any */}
            </div>

            {procedures.length === 0 && <p className="text-center text-gray-500 mt-10">Carregando serviços...</p>}
         </div>
      )}

      {/* Other Steps (Date, Time, Form) */}
      {step > 0 && (
        <>
            {/* Minimal Progress */}
            <div className="flex items-center justify-center space-x-2 mb-8 text-sm font-medium text-gray-400">
                <span className={step >= 1 ? 'text-fuchsia-600' : ''}>Data</span>
                <span>&rarr;</span>
                <span className={step >= 2 ? 'text-fuchsia-600' : ''}>Horário</span>
                <span>&rarr;</span>
                <span className={step >= 3 ? 'text-fuchsia-600' : ''}>Dados</span>
            </div>

            {/* Step 1: Date */}
            {step === 1 && (
                <div className="animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={prevStep} className="text-sm text-gray-400 hover:text-gray-600">← Voltar</button>
                        <h3 className="text-xl font-bold text-gray-800">Escolha a Data</h3>
                        <div className="w-10"></div>
                    </div>
                    
                    <div className="flex justify-center">
                        <Calendar 
                            selectedDate={date} 
                            onSelectDate={(d) => { setDate(d); setTime(''); }} 
                            closedDays={calendarStatus.closedDays}
                            blockedDates={calendarStatus.blockedBlocks
                                .filter((b: any) => {
                                    // Only block the Calendar Day if it's a FULL DAY block (00:00 to 23:59) or similar
                                    // If start_time is missing, assume full day
                                    // If start '00:00:00' and end >= '23:00:00'
                                    if (!b.start_time || b.start_time === '00:00:00') {
                                        if (!b.end_time || b.end_time >= '23:00:00') return true;
                                    }
                                    return false;
                                })
                                .map((b: any) => b.blocked_date.split('T')[0])
                            }
                        />
                    </div>
                    
                    <div className="mt-8 flex justify-between">
                         <div className="hidden md:block"></div> {/* Spacer */}
                         <button 
                            className={`w-full md:w-auto px-8 py-3 rounded-xl font-bold transition-all shadow-lg ${date ? 'bg-fuchsia-600 text-white hover:bg-fuchsia-700 transform hover:-translate-y-1' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                            disabled={!date}
                            onClick={nextStep}
                        >
                        Ver Horários
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Time */}
            {step === 2 && (
                <div className="animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={prevStep} className="text-sm text-gray-400 hover:text-gray-600">← Voltar</button>
                        <h3 className="text-xl font-bold text-gray-800">Disponibilidade</h3>
                         <div className="w-10"></div>
                    </div>
                    
                    <p className="text-center text-gray-500 mb-4 text-sm">
                        Para <strong>{selectedProcedure?.name}</strong> em {date.split('-').reverse().join('/')}
                    </p>

                    {loading ? (
                        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-fuchsia-600"></div></div>
                    ) : slots.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            {bookingSummary?.reason === 'FULL' ? (
                                <p className="text-orange-500 font-medium px-4">
                                    Não há horários disponíveis com duração suficiente ({bookingSummary.duration || selectedProcedure?.duration_minutes} min) para este serviço nesta data.
                                </p>
                            ) : bookingSummary?.reason === 'CLOSED_DAY' ? (
                                <p className="text-gray-500">Não há expediente nesta data.</p>
                            ) : (
                                <p className="text-gray-500">Sem horários livres.</p>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-3 max-h-60 overflow-y-auto custom-scrollbar p-1">
                            {slots.map((s) => {
                                // s is { time: 'HH:MM', available: boolean, reason: 'past'|'lunch'|'busy'|'closed' }
                                return (
                                <button
                                    key={s.time}
                                    disabled={!s.available}
                                    onClick={() => s.available && setTime(s.time)}
                                    className={`
                                        py-3 rounded-lg text-sm font-bold transition-all border relative overflow-hidden
                                        ${s.available 
                                            ? time === s.time
                                                ? 'bg-fuchsia-600 text-white border-fuchsia-600 shadow-lg scale-105 z-10'
                                                : 'bg-white text-gray-700 border-gray-200 hover:border-fuchsia-300 hover:bg-fuchsia-50'
                                            : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed opacity-60'
                                        }
                                    `}
                                >
                                    {s.time}
                                    {!s.available && s.reason === 'lunch' && <span className="absolute bottom-0.5 left-0 w-full text-[8px] text-center text-gray-400 font-normal">Almoço</span>}
                                </button>
                                );
                            })}
                        </div>
                    )}
                    
                    <div className="mt-8">
                         <button 
                            className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg ${time ? 'bg-fuchsia-600 text-white hover:bg-fuchsia-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                            disabled={!time}
                            onClick={nextStep}
                        >
                            Continuar
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Form */}
            {step === 3 && (
                <div className="animate-fade-in">
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={prevStep} className="text-sm text-gray-400 hover:text-gray-600">← Voltar</button>
                        <h3 className="text-xl font-bold text-gray-800">Finalizar</h3>
                        <div className="w-10"></div>
                    </div>

                    <div className="space-y-4">
                        <input 
                            type="text" 
                            className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 outline-none bg-gray-50"
                            value={form.name} 
                            onChange={e => setForm({...form, name: e.target.value})}
                            placeholder="Seu Nome"
                        />
                        <input 
                            type="text" 
                            className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 outline-none bg-gray-50"
                            value={form.contact} 
                            onChange={e => {
                                let v = e.target.value.replace(/\D/g, '');
                                if (v.length > 11) v = v.slice(0, 11);
                                
                                // Mask: (XX) XXXXX-XXXX
                                if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
                                if (v.length > 10) v = `${v.slice(0,10)}-${v.slice(10)}`; 
                                
                                // Let's use standard: (11) 91234-5678
                                const raw = e.target.value.replace(/\D/g, '');
                                let f = raw;
                                if (raw.length > 0) {
                                    f = raw.replace(/^(\d{2})(\d)/g, '($1) $2');
                                    f = f.replace(/(\d)(\d{4})$/, '$1-$2');
                                }
                                setForm({...form, contact: f});
                            }}
                            maxLength={15}
                            placeholder="Seu Contato (Zap)"
                        />
                    </div>

                    <div className="mt-6 bg-fuchsia-50 p-4 rounded-xl border border-fuchsia-100 text-center">
                        <p className="text-fuchsia-800 text-sm font-medium">Resumo</p>
                        <p className="text-gray-800 font-bold text-lg">{selectedProcedure?.name}</p>
                        <p className="text-gray-600 mb-2">{date.split('-').reverse().join('/')} às {time}</p>

                        {/* Price Summary with Validity Check */}
                        {(() => {
                           // Check if promo applies to DATE
                           const isPromoDate = !!selectedProcedure?.is_promotional && 
                                               (!selectedProcedure?.promo_end_date || (isValidDate(new Date(selectedProcedure?.promo_end_date!)) && new Date(selectedProcedure?.promo_end_date!) >= new Date(date + 'T' + time)));
                           
                           // Check Vacancy
                           const procId = selectedProcedure?.id || 0;
                           const vacancy = promoAvailability[procId];
                           const hasVacancy = vacancy === undefined || vacancy > 0;

                           const isEligible = isPromoDate && hasVacancy;

                           return (
                               <div>
                                   {!isEligible && !!selectedProcedure?.is_promotional && (
                                       <div className="text-xs text-orange-600 font-bold bg-orange-50 border border-orange-100 p-2 rounded mb-2">
                                           {!hasVacancy ? '⚠️ Vagas promocionais esgotadas.' : '⚠️ Promoção não válida para esta data.'}
                                       </div>
                                   )}
                                   {isEligible ? (
                                       <div className="flex flex-col items-center">
                                            <span className="text-xs text-gray-400 line-through">R$ {safeFloat(selectedProcedure!.price).toFixed(2)}</span>
                                            <span className="font-bold text-xl text-green-600">Total: R$ {safeFloat(selectedProcedure!.promo_price).toFixed(2)}</span>
                                       </div>
                                   ) : (
                                       <p className="font-bold text-xl text-gray-900">Total: R$ {safeFloat(selectedProcedure?.price).toFixed(2)}</p>
                                   )}
                               </div>
                           );
                        })()}
                    </div>

                    {error && <p className="text-red-500 text-center mt-4 text-sm">{error}</p>}

                    <button 
                        className={`w-full mt-6 py-4 rounded-xl font-bold text-white shadow-xl transition-all ${loading ? 'bg-gray-400' : 'bg-gray-900 hover:bg-black'}`}
                        disabled={!form.name || !form.contact || loading}
                        onClick={handleBooking}
                    >
                        {loading ? 'Confirmando...' : 'Confirmar Agendamento'}
                    </button>
                </div>
            )}
        </>
      )}
    </div>
  );
}
