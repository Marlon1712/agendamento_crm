'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronDown, Pencil, Scissors } from 'lucide-react';
import Calendar from './Calendar';

type BookingData = {
    id?: number;
    name: string;
    contact: string;
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
  const [procedureId, setProcedureId] = useState<number | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState<string | null>(null);
  const [price, setPrice] = useState<string>('');
  
  const [availableSlots, setAvailableSlots] = useState<{time: string, available: boolean, reason?: string}[]>([]);
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [showClientList, setShowClientList] = useState(false);
  const [showServiceList, setShowServiceList] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  // Initialize
  useEffect(() => {
    if (isOpen) {
        // Fetch Data
        fetch('/api/clients').then(res => res.json()).then(setClients);
        fetch('/api/procedures')
            .then(res => res.json())
            .then(data => setProcedures(Array.isArray(data) ? data : data.procedures || []))
            .catch(() => setProcedures([]));

        if (bookingToEdit) {
            setClientName(bookingToEdit.name);
            setClientContact(bookingToEdit.contact);
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
            setProcedureId(null);
            setDate(initialDate || '');
            setTime(initialTime || null);
            setPrice('');
            setAdminNotes('');
        }
    }
  }, [isOpen, initialDate, initialTime, bookingToEdit]);

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
      const match = clients.find(c => c.name === val);
      if (match) {
          setClientContact(match.contact);
      }
  };

  const handleSubmit = async () => {
      if (!clientName || !clientContact || !date || !time || !procedureId) return;
      
      setLoading(true);
      try {
          let url = '/api/leads/create';
          let method = 'POST';
          let body: any = {
              name: clientName,
              contact: clientContact,
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

  return (
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" style={{ zIndex: 2147483647 }}>
      <div className="bg-[#f8f6f7] dark:bg-[#221018] border border-[#e7cfd9] dark:border-[#522a3a] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="sticky top-0 z-10 bg-[#f8f6f7]/95 dark:bg-[#221018]/95 backdrop-blur border-b border-[#e7cfd9] dark:border-[#522a3a] px-4 py-3 flex justify-between items-center shrink-0">
            <h3 className="text-lg font-bold text-[#1b0d13] dark:text-white">{bookingToEdit ? 'Editar Agendamento' : 'Novo Agendamento'}</h3>
            <button onClick={onClose} type="button" className="text-[#1b0d13]/60 dark:text-white/70 hover:text-[#1b0d13] dark:hover:text-white transition-colors">✕</button>
        </div>
        
        <div className="px-4 py-6 space-y-5 overflow-y-auto">
          {isEditMode && (
            <>
              <div className="bg-[#fcf8fa] dark:bg-[#2d1b24] border border-[#e7cfd9] dark:border-[#522a3a] rounded-xl p-4 flex items-center gap-4 shadow-sm">
                <div className="bg-[#ee2b7c]/10 dark:bg-[#ee2b7c]/20 p-3 rounded-full flex items-center justify-center shrink-0">
                  <CalendarIcon size={18} className="text-[#ee2b7c]" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-[#9a4c6c] dark:text-[#ee2b7c]/80 uppercase tracking-wider mb-0.5">Data e Hora</p>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-[#1b0d13] dark:text-white">
                      {date ? date.split('-').reverse().join('/') : '--/--/----'}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-[#e7cfd9] dark:bg-[#522a3a]"></span>
                    <span className="text-base font-semibold text-[#1b0d13] dark:text-white">
                      {time ? time.slice(0, 5) : '--:--'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (onRequestReschedule) {
                      onClose();
                      onRequestReschedule();
                    }
                  }}
                  className="text-[#ee2b7c] text-sm font-bold hover:underline"
                >
                  Alterar
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-base font-medium text-[#1b0d13] dark:text-white">Serviço</label>
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
                    className="w-full appearance-none bg-[#fcf8fa] dark:bg-[#2d1b24] border border-[#e7cfd9] dark:border-[#522a3a] rounded-xl h-14 pl-12 pr-10 text-base text-[#1b0d13] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#ee2b7c]/50 focus:border-[#ee2b7c] transition-shadow cursor-pointer"
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
                <label className="text-base font-medium text-[#1b0d13] dark:text-white">Nota Rápida</label>
                <div className="relative group">
                  <textarea
                    className="w-full bg-[#fcf8fa] dark:bg-[#2d1b24] border border-[#e7cfd9] dark:border-[#522a3a] rounded-xl min-h-[140px] p-4 text-base text-[#1b0d13] dark:text-white placeholder-[#9a4c6c] focus:outline-none focus:ring-2 focus:ring-[#ee2b7c]/50 focus:border-[#ee2b7c] transition-shadow resize-none"
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
                    className="w-full p-3 bg-[#fcf8fa] dark:bg-[#2d1b24] border border-[#e7cfd9] dark:border-[#522a3a] rounded-xl focus:ring-2 focus:ring-[#ee2b7c]/50 outline-none text-[#1b0d13] dark:text-[#fcf8fa] placeholder-[#9a4c6c]"
                    placeholder="Busque ou digite o nome..."
                    value={clientName}
                    onChange={handleClientSelect}
                    onFocus={() => setShowClientList(true)}
                    onBlur={() => setTimeout(() => setShowClientList(false), 200)}
                />
                
                {showClientList && clientName.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#fcf8fa] dark:bg-[#2d1b24] border border-[#e7cfd9] dark:border-[#522a3a] rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto custom-scrollbar">
                        {clients
                            .filter(c => c.name.toLowerCase().includes(clientName.toLowerCase()))
                            .map((c, i) => (
                                <div 
                                    key={i}
                                    className="p-3 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer border-b border-[#e7cfd9] dark:border-[#522a3a] last:border-0 transition-colors"
                                    onClick={() => {
                                        setClientName(c.name);
                                        setClientContact(c.contact);
                                        setShowClientList(false);
                                    }}
                                >
                                    <p className="font-bold text-[#1b0d13] dark:text-[#fcf8fa] text-sm">{c.name}</p>
                                    <p className="text-xs text-[#9a4c6c] dark:text-gray-400">{c.contact}</p>
                                </div>
                            ))
                        }
                        {clients.filter(c => c.name.toLowerCase().includes(clientName.toLowerCase())).length === 0 && (
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
                    className="w-full p-3 bg-[#fcf8fa] dark:bg-[#2d1b24] border border-[#e7cfd9] dark:border-[#522a3a] rounded-xl focus:ring-2 focus:ring-[#ee2b7c]/50 outline-none text-[#1b0d13] dark:text-[#fcf8fa] placeholder-[#9a4c6c]"
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

            {/* Service & Price Row */}
            <div className="grid grid-cols-2 gap-3">
                <div className="col-span-1">
                    <label className="block text-xs font-medium text-[#9a4c6c] dark:text-[#ee2b7c]/80 mb-1 uppercase tracking-wider">Serviço</label>
                    <div className="relative">
                        <div 
                            onClick={() => setShowServiceList(!showServiceList)}
                            className="w-full p-3 bg-[#fcf8fa] dark:bg-[#2d1b24] border border-[#e7cfd9] dark:border-[#522a3a] rounded-xl cursor-pointer flex justify-between items-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors truncate"
                        >
                            <span className={`text-sm font-medium truncate ${procedureId ? 'text-[#1b0d13] dark:text-[#fcf8fa]' : 'text-[#9a4c6c]'}`}>
                                {procedureId 
                                    ? procedures.find(p => p.id === procedureId)?.name || '...' 
                                    : 'Selecione...'}
                            </span>
                        </div>

                        {showServiceList && (
                            <div className="absolute top-full left-0 w-[200%] md:w-full mt-1 bg-[#fcf8fa] dark:bg-[#2d1b24] border border-[#e7cfd9] dark:border-[#522a3a] rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar">
                                {procedures.map(p => {
                                    const isPromo = !!p.is_promotional && (!p.promo_end_date || new Date(p.promo_end_date) > new Date());
                                    return (
                                        <div 
                                            key={p.id} 
                                            onClick={() => handleServiceSelect(p)}
                                            className={`p-3 border-b border-[#e7cfd9] dark:border-[#522a3a] last:border-0 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex justify-between items-center ${procedureId === p.id ? 'bg-[#ee2b7c]/10' : ''}`}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-bold text-[#1b0d13] dark:text-[#fcf8fa] text-sm">{p.name}</span>
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
                        className="w-full p-3 bg-[#fcf8fa] dark:bg-[#2d1b24] border border-[#e7cfd9] dark:border-[#522a3a] rounded-xl focus:ring-2 focus:ring-[#ee2b7c]/50 outline-none text-[#1b0d13] dark:text-[#fcf8fa] font-bold"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0.00"
                    />
                </div>
            </div>
            </>
          )}

            {/* Date */}
            {!isEditMode && (
            <div>
                <label className="block text-xs font-medium text-[#9a4c6c] dark:text-[#ee2b7c]/80 mb-1 uppercase tracking-wider">Data do Agendamento</label>
                <div className="flex justify-center pt-2">
                     <Calendar 
                        selectedDate={date} 
                        onSelectDate={(d) => setDate(d)} 
                        blockedDates={[]} 
                     />
                </div>
            </div>
            )}

            {!isEditMode && date && procedureId && (
                <div>
                   <div className="flex justify-between items-center mb-1">
                       <label className="block text-xs font-medium text-[#9a4c6c] dark:text-[#ee2b7c]/80 uppercase tracking-wider">Horário</label>
                       <div className="flex items-center gap-2">
                            <input 
                                type="checkbox" 
                                id="admin-custom-time" 
                                className="w-4 h-4 text-[#ee2b7c] rounded border-[#e7cfd9] dark:border-[#522a3a] bg-[#fcf8fa] dark:bg-[#2d1b24] focus:ring-[#ee2b7c]"
                                checked={isCustomTime}
                                onChange={(e) => {
                                    setIsCustomTime(e.target.checked);
                                    setTime(null); 
                                }}
                            />
                            <label htmlFor="admin-custom-time" className="text-xs text-[#9a4c6c] dark:text-gray-400 font-medium cursor-pointer select-none">
                                Horário Personalizado
                            </label>
                        </div>
                   </div>

                   {isCustomTime ? (
                       <div className="p-3 bg-[#fcf8fa] dark:bg-[#2d1b24] border border-[#e7cfd9] dark:border-[#522a3a] rounded-xl flex gap-2 justify-center items-center">
                           <select 
                               value={time?.split(':')[0] || ''}
                               onChange={(e) => {
                                   const newH = e.target.value;
                                   const curM = time?.split(':')[1] || '00';
                                   setTime(`${newH}:${curM}`);
                               }}
                               className="p-2 bg-white dark:bg-[#1b0d13] border border-[#e7cfd9] dark:border-[#522a3a] rounded-lg text-lg font-bold text-[#1b0d13] dark:text-white outline-none focus:ring-2 focus:ring-[#ee2b7c] w-20 text-center appearance-none"
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
                               className="p-2 bg-white dark:bg-[#1b0d13] border border-[#e7cfd9] dark:border-[#522a3a] rounded-lg text-lg font-bold text-[#1b0d13] dark:text-white outline-none focus:ring-2 focus:ring-[#ee2b7c] w-20 text-center appearance-none"
                           >
                               {Array.from({ length: 12 }).map((_, i) => {
                                   const m = (i * 5).toString().padStart(2, '0');
                                   return <option key={m} value={m}>{m}</option>;
                               })} 
                           </select>
                       </div>
                   ) : (
                       availableSlots.length > 0 ? (
                           <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                           {availableSlots.map(slot => {
                                   // Allow if available OR Past (admin override)
                                   const isSelectable = slot.available || slot.reason === 'past';
                                   
                                   return (
                                       <button
                                          type="button"
                                          key={slot.time}
                                          onClick={() => isSelectable && setTime(slot.time)}
                                          disabled={!isSelectable}
                                          className={`
                                            p-2 rounded-lg text-sm font-bold border transition-all
                                            ${time === slot.time
                                                ? 'bg-[#ee2b7c] text-white border-[#ee2b7c]' 
                                                : slot.available
                                                    ? 'bg-[#fcf8fa] dark:bg-[#2d1b24] text-[#1b0d13] dark:text-white border-[#e7cfd9] dark:border-[#522a3a] hover:border-[#ee2b7c] hover:text-[#ee2b7c]'
                                                : slot.reason === 'past'
                                                        ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100'
                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-60'}
                                          `}
                                          title={isSelectable ? 'Disponível (ou Ajuste)' : 'Indisponível'}
                                       >
                                           {slot.time.slice(0, 5)}
                                       </button>
                                   );
                               })}
                           </div>
                       ) : (
                           <p className="text-sm text-[#9a4c6c] dark:text-gray-400 italic">Nenhum horário disponível (use Hora Personalizada se necessário).</p>
                       )
                   )}
                </div>
            )}

        </div>

        <div className="sticky bottom-0 bg-[#f8f6f7]/95 dark:bg-[#221018]/95 backdrop-blur border-t border-[#e7cfd9] dark:border-[#522a3a] p-4 flex flex-col gap-3">
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
