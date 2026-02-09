'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronDown, Pencil, Scissors } from 'lucide-react';

type BookingData = {
    id?: number;
    name: string;
    contact: string;
    cpf?: string | null;
    procedure_id: number;
    appointment_date: string;
    appointment_time: string;
    price: number;
    status: string;
};

type AdminBookingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDate?: string;
  initialTime?: string;
  bookingToEdit?: BookingData | null;
  onRequestReschedule?: () => void;
};

export default function AdminBookingModal({ isOpen, onClose, onSuccess, initialDate, initialTime, bookingToEdit, onRequestReschedule }: AdminBookingModalProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [procedures, setProcedures] = useState<any[]>([]);

  // Form State
  const [clientName, setClientName] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [clientCpf, setClientCpf] = useState('');
  const [procedureId, setProcedureId] = useState<number | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState<string | null>(null);
  const [price, setPrice] = useState<string>('');
  const [viewMonth, setViewMonth] = useState<Date | null>(null);
  
  const [availableSlots, setAvailableSlots] = useState<{time: string, available: boolean, reason?: string}[]>([]);
  const [showClientList, setShowClientList] = useState(false);
  const [showServiceList, setShowServiceList] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  // Initialize
  useEffect(() => {
    if (isOpen) {
        // Fetch Data
        fetch('/api/clients')
            .then(res => res.json())
            .then(data => setClients(Array.isArray(data) ? data : data.clients || []))
            .catch(() => setClients([]));
        fetch('/api/procedures')
            .then(res => res.json())
            .then(data => setProcedures(Array.isArray(data) ? data : data.procedures || []))
            .catch(() => setProcedures([]));

        if (bookingToEdit) {
            setClientName(bookingToEdit.name);
            setClientContact(bookingToEdit.contact);
            setClientCpf((bookingToEdit as any).cpf || '');
            setProcedureId(bookingToEdit.procedure_id);
            // Handle Date: might come as ISO string or YYYY-MM-DD
            const d = bookingToEdit.appointment_date.includes('T') ? bookingToEdit.appointment_date.split('T')[0] : bookingToEdit.appointment_date;
            setDate(d);
            
            // Handle Time: HH:MM or HH:MM:SS
            const t = bookingToEdit.appointment_time.slice(0, 5);
            setTime(t);
            setPrice(String(bookingToEdit.price));
            setAdminNotes((bookingToEdit as any).admin_notes || '');
        } else {
            // Reset state for new booking
            setClientName('');
            setClientContact('');
            setClientCpf('');
            setProcedureId(null);
            setDate(initialDate || '');
            setTime(initialTime || null);
            setPrice('');
            setAdminNotes('');
        }
    }
  }, [isOpen, initialDate, initialTime, bookingToEdit]);

  useEffect(() => {
      if (!isOpen) return;
      if (date) {
          const d = new Date(date.split('-')[0] as any, Number(date.split('-')[1]) - 1, Number(date.split('-')[2]));
          setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1));
      } else {
          const now = new Date();
          setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1));
      }
  }, [isOpen, date]);

  // Fetch Slots when Date/Procedure changes
  useEffect(() => {
      if (date && procedureId) {
          fetch(`/api/slots/available?date=${date}&procedureId=${procedureId}`)
            .then(res => res.json())
            .then(data => setAvailableSlots(data.slots || []))
            .catch(err => console.error(err));
      } else {
          setAvailableSlots([]);
      }
  }, [date, procedureId]);

  // Update Price when Procedure changes
  const handleServiceSelect = (p: any) => {
      setProcedureId(p.id);
      setShowServiceList(false);
      
      const isPromo = !!p.is_promotional && (!p.promo_end_date || new Date(p.promo_end_date) > new Date());
      const newPrice = isPromo ? p.promo_price : p.price;
      setPrice(String(newPrice));
  };

  const handleClientSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setClientName(val);
      // Auto-fill contact if match
      const match = (Array.isArray(clients) ? clients : []).find(c => c.name === val);
      if (match) {
          setClientContact(match.contact);
          if (match.cpf) setClientCpf(match.cpf);
      }
  };

  const handleSubmit = async () => {
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
      if (!clientName || !clientContact || !date || !time || !procedureId) return;
      if (clientCpf && !isValidCpf(clientCpf)) {
          alert('CPF inválido.');
          return;
      }
      
      setLoading(true);
      try {
          let url = '/api/leads/create';
          let method = 'POST';
          let body: any = {
              name: clientName,
              contact: clientContact,
              cpf: clientCpf || null,
              procedure_id: procedureId,
              date,
              time,
              price: price ? parseFloat(price) : undefined,
              status: 'agendado'
          };

          if (bookingToEdit && bookingToEdit.id) {
              url = `/api/leads/${bookingToEdit.id}`;
              method = 'PATCH';
              // Update names to match PATCH expected body
              body = {
                  ...body,
                  appointmentDate: date,
                  appointmentTime: time,
                  procedureId: procedureId,
                  cpf: clientCpf || null,
              };
          }

          const res = await fetch(url, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
          });
          
          if (res.ok) {
              if (bookingToEdit && bookingToEdit.id) {
                  try {
                      await fetch(`/api/leads/${bookingToEdit.id}/notes`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ admin_notes: adminNotes })
                      });
                  } catch {}
              }
              alert(bookingToEdit ? 'Agendamento atualizado!' : 'Agendamento criado!');
              onSuccess();
              onClose();
          } else {
              const err = await res.json();
              alert('Erro: ' + (err.error || 'Falha ao salvar'));
          }
      } catch (e) {
          alert('Erro de conexão');
      } finally {
          setLoading(false);
      }
  };

  if (!isOpen) return null;

  const isEditMode = !!bookingToEdit;
  const weekDays = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];
  const toLocalDate = (value: string) => {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };
  const formatISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const selectedDate = date ? toLocalDate(date) : new Date();
  const monthLabel = (viewMonth || selectedDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  const monthStart = viewMonth ? new Date(viewMonth) : new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  const monthDays = monthEnd.getDate();
  const firstWeekDay = (monthStart.getDay() + 6) % 7; // monday-based
  const gridCells = Array.from({ length: firstWeekDay + monthDays }, (_, i) => {
    if (i < firstWeekDay) return null;
    const day = i - firstWeekDay + 1;
    return new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
  });

  return (
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm dark" style={{ zIndex: 2147483647 }}>
      <div className="bg-[#0b1220] border border-[#1f2a44] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="sticky top-0 z-10 bg-[#0b1220]/95 backdrop-blur border-b border-[#1f2a44] px-4 py-3 flex justify-between items-center shrink-0">
            <h3 className="text-lg font-bold text-white">{bookingToEdit ? 'Editar Agendamento' : 'Novo Agendamento'}</h3>
            <button onClick={onClose} type="button" className="text-white/70 hover:text-white transition-colors">✕</button>
        </div>
        
        <div className="px-4 py-6 space-y-5 overflow-y-auto">
          {isEditMode && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-base font-medium text-white">Serviço</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <Scissors size={16} className="text-[#9a4c6c] group-focus-within:text-[#ee2b7c]" />
                  </div>
                  <select
                    value={procedureId || ''}
                    onChange={(e) => {
                      setProcedureId(Number(e.target.value));
                      setAvailableSlots([]);
                      setTime('');
                    }}
                    className="w-full appearance-none bg-[#101827] border border-[#1f2a44] rounded-xl h-14 pl-12 pr-10 text-base text-white focus:outline-none focus:ring-2 focus:ring-[#ee2b7c]/50 focus:border-[#ee2b7c] transition-shadow cursor-pointer"
                  >
                    {procedures.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <ChevronDown size={18} className="text-[#ee2b7c]" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-base font-medium text-white">Nota Rápida</label>
                <div className="relative group">
                  <textarea
                    className="w-full bg-[#101827] border border-[#1f2a44] rounded-xl min-h-[140px] p-4 text-base text-white placeholder-[#9aa3b2] focus:outline-none focus:ring-2 focus:ring-[#ee2b7c]/50 focus:border-[#ee2b7c] transition-shadow resize-none"
                    placeholder="Ex: Cliente tem alergia a acetona..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  />
                  <div className="absolute bottom-4 right-4 pointer-events-none">
                    <Pencil size={18} className="text-[#9a4c6c]/70" />
                  </div>
                </div>
                <p className="text-xs text-[#9a4c6c] pl-1">Informações importantes para o profissional.</p>
              </div>

            </>
          )}

          {!isEditMode && (
            <>

            {/* Client Selection */}
            <div className="relative">
                <label className="block text-xs font-medium text-[#9a4c6c] dark:text-[#ee2b7c]/80 mb-1 uppercase tracking-wider">Cliente</label>
                <input 
                    type="text"
                    className="w-full p-3 bg-[#101827] border border-[#1f2a44] rounded-xl focus:ring-2 focus:ring-[#ee2b7c]/50 outline-none text-white placeholder-[#9aa3b2]"
                    placeholder="Busque ou digite o nome..."
                    value={clientName}
                    onChange={handleClientSelect}
                    onFocus={() => setShowClientList(true)}
                    onBlur={() => setTimeout(() => setShowClientList(false), 200)}
                />
                
                {showClientList && clientName.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#101827] border border-[#1f2a44] rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto custom-scrollbar">
                        {(Array.isArray(clients) ? clients : [])
                            .filter(c => c.name.toLowerCase().includes(clientName.toLowerCase()))
                            .map((c, i) => (
                                <div 
                                    key={i}
                                    className="p-3 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer border-b border-[#1f2a44] last:border-0 transition-colors"
                                    onClick={() => {
                                        setClientName(c.name);
                                        setClientContact(c.contact);
                                        if (c.cpf) setClientCpf(c.cpf);
                                        setShowClientList(false);
                                    }}
                                >
                                    <p className="font-bold text-white text-sm">{c.name}</p>
                                    <p className="text-xs text-[#9a4c6c] dark:text-gray-400">{c.contact}</p>
                                </div>
                            ))
                        }
                        {(Array.isArray(clients) ? clients : []).filter(c => c.name.toLowerCase().includes(clientName.toLowerCase())).length === 0 && (
                            <div className="p-3 text-[#9a4c6c] text-xs italic text-center">Nenhum cliente encontrado.</div>
                        )}
                    </div>
                )}
            </div>

            {/* Contact */}
            <div>
                <label className="block text-xs font-medium text-[#9a4c6c] dark:text-[#ee2b7c]/80 mb-1 uppercase tracking-wider">Contato (WhatsApp)</label>
                <input 
                    type="text"
                    className="w-full p-3 bg-[#101827] border border-[#1f2a44] rounded-xl focus:ring-2 focus:ring-[#ee2b7c]/50 outline-none text-white placeholder-[#9aa3b2]"
                    placeholder="(XX) XXXXX-XXXX"
                    value={clientContact}
                    onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, '');
                        if (v.length > 11) v = v.slice(0, 11);
                        if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
                        if (v.length > 10) v = `${v.slice(0,10)}-${v.slice(10)}`;
                        setClientContact(v);
                    }}
                />
            </div>

            {/* CPF */}
            <div>
                <label className="block text-xs font-medium text-[#9a4c6c] dark:text-[#ee2b7c]/80 mb-1 uppercase tracking-wider">CPF</label>
                <input
                    type="text"
                    className="w-full p-3 bg-[#101827] border border-[#1f2a44] rounded-xl focus:ring-2 focus:ring-[#ee2b7c]/50 outline-none text-white placeholder-[#9aa3b2]"
                    placeholder="000.000.000-00"
                    value={clientCpf}
                    onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, '').slice(0, 11);
                        const p1 = v.slice(0, 3);
                        const p2 = v.slice(3, 6);
                        const p3 = v.slice(6, 9);
                        const p4 = v.slice(9, 11);
                        v = v.length <= 3 ? p1 : v.length <= 6 ? `${p1}.${p2}` : v.length <= 9 ? `${p1}.${p2}.${p3}` : `${p1}.${p2}.${p3}-${p4}`;
                        setClientCpf(v);
                    }}
                />
            </div>

            {/* Service & Price Row */}
            <div className="grid grid-cols-2 gap-3">
                <div className="col-span-1">
                    <label className="block text-xs font-medium text-[#9a4c6c] dark:text-[#ee2b7c]/80 mb-1 uppercase tracking-wider">Serviço</label>
                    <div className="relative">
                        <div 
                            onClick={() => setShowServiceList(!showServiceList)}
                            className="w-full p-3 bg-[#101827] border border-[#1f2a44] rounded-xl cursor-pointer flex justify-between items-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors truncate"
                        >
                            <span className={`text-sm font-medium truncate ${procedureId ? 'text-white' : 'text-[#9a4c6c]'}`}>
                                {procedureId 
                                    ? procedures.find(p => p.id === procedureId)?.name || '...' 
                                    : 'Selecione...'}
                            </span>
                        </div>

                        {showServiceList && (
                            <div className="absolute top-full left-0 w-[200%] md:w-full mt-1 bg-[#101827] border border-[#1f2a44] rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar">
                                {procedures.map(p => {
                                    const isPromo = !!p.is_promotional && (!p.promo_end_date || new Date(p.promo_end_date) > new Date());
                                    return (
                                        <div 
                                            key={p.id} 
                                            onClick={() => handleServiceSelect(p)}
                                            className={`p-3 border-b border-[#1f2a44] last:border-0 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex justify-between items-center ${procedureId === p.id ? 'bg-[#ee2b7c]/10' : ''}`}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white text-sm">{p.name}</span>
                                                {isPromo && <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Promo</span>}
                                            </div>
                                            <div className="text-right">
                                                {isPromo ? (
                                                    <span className="block text-sm font-bold text-emerald-400">R$ {p.promo_price}</span>
                                                ) : (
                                                    <span className="text-sm font-bold text-[#9a4c6c] dark:text-gray-300">R$ {p.price}</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Price Input (Admin Override) */}
                <div className="col-span-1">
                    <label className="block text-xs font-medium text-[#9a4c6c] dark:text-[#ee2b7c]/80 mb-1 uppercase tracking-wider">Valor (R$)</label>
                    <input 
                        type="number"
                        step="0.01"
                        className="w-full p-3 bg-[#101827] border border-[#1f2a44] rounded-xl focus:ring-2 focus:ring-[#ee2b7c]/50 outline-none text-white font-bold"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0.00"
                    />
                </div>
            </div>
            </>
          )}

            <div className="rounded-2xl border border-[#1f2a44] bg-[#0f172a] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon size={16} className="text-[#ee2b7c]" />
                  <h4 className="text-sm font-bold text-white">Data e Hora</h4>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewMonth(new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1))}
                    className="h-7 w-7 rounded-full border border-[#1f2a44] text-white/70 hover:text-white hover:border-[#ee2b7c]/60"
                    aria-label="Mês anterior"
                  >
                    ‹
                  </button>
                  <span className="text-xs font-semibold text-[#ee2b7c] capitalize">{monthLabel}</span>
                  <button
                    type="button"
                    onClick={() => setViewMonth(new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1))}
                    className="h-7 w-7 rounded-full border border-[#1f2a44] text-white/70 hover:text-white hover:border-[#ee2b7c]/60"
                    aria-label="Próximo mês"
                  >
                    ›
                  </button>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-7 gap-2 text-[10px] uppercase tracking-wide text-white/50">
                {weekDays.map(day => (
                  <div key={day} className="text-center">{day}</div>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-7 gap-2">
                {gridCells.map((cell, idx) => {
                  if (!cell) {
                    return <div key={`empty-${idx}`} className="h-9" />;
                  }
                  const iso = formatISO(cell);
                  const isActive = iso === date;
                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => setDate(iso)}
                      className={`h-9 rounded-xl border text-xs font-semibold transition-all ${
                        isActive
                          ? 'border-[#ee2b7c] bg-[#ee2b7c] text-white shadow-[0_0_0_2px_rgba(238,43,124,0.15)]'
                          : 'border-[#1f2a44] bg-[#101827] text-white/80 hover:border-[#ee2b7c]/60'
                      }`}
                    >
                      {String(cell.getDate()).padStart(2, '0')}
                    </button>
                  );
                })}
              </div>

              {date && procedureId ? (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-[#9a4c6c] uppercase tracking-wider">Horários</label>
                    <span className="text-[11px] text-white/50">Selecione um horário</span>
                  </div>
                  {availableSlots.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2">
                      {availableSlots.map(slot => {
                        const isSelectable = slot.available || slot.reason === 'past';
                        const isDisabled = !isSelectable;
                        return (
                          <button
                            type="button"
                            key={slot.time}
                            onClick={() => isSelectable && setTime(slot.time)}
                            disabled={isDisabled}
                            className={`rounded-full border px-0 py-2 text-xs font-bold transition-all ${
                              time === slot.time
                                ? 'bg-[#ee2b7c] text-white border-[#ee2b7c] shadow-[0_0_0_2px_rgba(238,43,124,0.2)]'
                                : isDisabled
                                  ? 'border-[#1f2a44] text-white/30 line-through bg-[#0b1220]'
                                  : 'border-[#1f2a44] text-white/80 hover:border-[#ee2b7c]/70 bg-[#101827]'
                            }`}
                          >
                            {slot.time.slice(0, 5)}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-[#9a4c6c] italic">Nenhum horário disponível.</p>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-xs text-[#9a4c6c] italic">Selecione serviço e data para ver os horários.</p>
              )}
            </div>

        </div>

        <div className="sticky bottom-0 bg-[#0b1220]/95 backdrop-blur border-t border-[#1f2a44] p-4 flex flex-col gap-3">
            <button 
                onClick={handleSubmit}
                type="button"
                disabled={loading || !time || !clientName}
                className="w-full flex items-center justify-center gap-2 bg-[#ee2b7c] hover:bg-[#ee2b7c]/90 text-white font-bold text-base h-12 rounded-xl shadow-lg shadow-[#ee2b7c]/30 active:scale-[0.98] transition-all disabled:opacity-50"
            >
                {loading ? 'Salvando...' : (bookingToEdit ? 'Salvar Alterações' : 'Confirmar Agendamento')}
            </button>
            <button 
                onClick={onClose}
                type="button"
                className="w-full text-sm text-[#9a4c6c] dark:text-gray-400 font-medium hover:text-red-500 transition-colors"
                disabled={loading}
            >
                {bookingToEdit ? 'Cancelar Agendamento' : 'Cancelar'}
            </button>
        </div>
      </div>
    </div>
  );
}
