'use client';

import { useState, useEffect } from 'react';
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
  bookingToEdit?: BookingData | null;
};

export default function AdminBookingModal({ isOpen, onClose, onSuccess, initialDate, bookingToEdit }: AdminBookingModalProps) {
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
        } else {
            // Reset state for new booking
            setClientName('');
            setClientContact('');
            setProcedureId(null);
            setDate(initialDate || '');
            setTime(null);
            setPrice('');
        }
    }
  }, [isOpen, initialDate, bookingToEdit]);

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

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center shrink-0">
            <h3 className="text-lg font-bold text-white">{bookingToEdit ? 'Editar Agendamento' : 'Novo Agendamento'}</h3>
            <button onClick={onClose} type="button" className="text-slate-400 hover:text-white transition-colors">✕</button>
        </div>
        
        <div className="p-6 space-y-4 overflow-y-auto">
            
            {/* Client Selection */}
            <div className="relative">
                <label className="block text-xs font-bold text-fuchsia-400 mb-1 uppercase">Cliente</label>
                <input 
                    type="text"
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-fuchsia-500 outline-none text-white placeholder-slate-500"
                    placeholder="Busque ou digite o nome..."
                    value={clientName}
                    onChange={handleClientSelect}
                    onFocus={() => setShowClientList(true)}
                    onBlur={() => setTimeout(() => setShowClientList(false), 200)}
                />
                
                {showClientList && clientName.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto custom-scrollbar">
                        {clients
                            .filter(c => c.name.toLowerCase().includes(clientName.toLowerCase()))
                            .map((c, i) => (
                                <div 
                                    key={i}
                                    className="p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 last:border-0 transition-colors"
                                    onClick={() => {
                                        setClientName(c.name);
                                        setClientContact(c.contact);
                                        setShowClientList(false);
                                    }}
                                >
                                    <p className="font-bold text-white text-sm">{c.name}</p>
                                    <p className="text-xs text-slate-400">{c.contact}</p>
                                </div>
                            ))
                        }
                        {clients.filter(c => c.name.toLowerCase().includes(clientName.toLowerCase())).length === 0 && (
                            <div className="p-3 text-slate-500 text-xs italic text-center">Nenhum cliente encontrado.</div>
                        )}
                    </div>
                )}
            </div>

            {/* Contact */}
            <div>
                <label className="block text-xs font-bold text-fuchsia-400 mb-1 uppercase">Contato (WhatsApp)</label>
                <input 
                    type="text"
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-fuchsia-500 outline-none text-white placeholder-slate-500"
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
                    <label className="block text-xs font-bold text-fuchsia-400 mb-1 uppercase">Serviço</label>
                    <div className="relative">
                        <div 
                            onClick={() => setShowServiceList(!showServiceList)}
                            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl cursor-pointer flex justify-between items-center hover:bg-slate-700/50 transition-colors truncate"
                        >
                            <span className={`text-sm font-medium truncate ${procedureId ? 'text-white' : 'text-slate-500'}`}>
                                {procedureId 
                                    ? procedures.find(p => p.id === procedureId)?.name || '...' 
                                    : 'Selecione...'}
                            </span>
                        </div>

                        {showServiceList && (
                            <div className="absolute top-full left-0 w-[200%] md:w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar">
                                {procedures.map(p => {
                                    const isPromo = !!p.is_promotional && (!p.promo_end_date || new Date(p.promo_end_date) > new Date());
                                    return (
                                        <div 
                                            key={p.id} 
                                            onClick={() => handleServiceSelect(p)}
                                            className={`p-3 border-b border-slate-700/50 last:border-0 cursor-pointer hover:bg-slate-700 transition-colors flex justify-between items-center ${procedureId === p.id ? 'bg-fuchsia-900/20' : ''}`}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white text-sm">{p.name}</span>
                                                {isPromo && <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Promo</span>}
                                            </div>
                                            <div className="text-right">
                                                {isPromo ? (
                                                    <span className="block text-sm font-bold text-emerald-400">R$ {p.promo_price}</span>
                                                ) : (
                                                    <span className="text-sm font-bold text-slate-300">R$ {p.price}</span>
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
                    <label className="block text-xs font-bold text-fuchsia-400 mb-1 uppercase">Valor (R$)</label>
                    <input 
                        type="number"
                        step="0.01"
                        className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-fuchsia-500 outline-none text-white font-bold"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0.00"
                    />
                </div>
            </div>

            {/* Date */}
            <div>
                <label className="block text-xs font-bold text-fuchsia-400 mb-1 uppercase">Data do Agendamento</label>
                <div className="flex justify-center pt-2">
                     <Calendar 
                        selectedDate={date} 
                        onSelectDate={(d) => setDate(d)} 
                        blockedDates={[]} 
                     />
                </div>
            </div>

            {date && procedureId && (
                <div>
                   <div className="flex justify-between items-center mb-1">
                       <label className="block text-xs font-bold text-fuchsia-400 uppercase">Horário</label>
                       <div className="flex items-center gap-2">
                            <input 
                                type="checkbox" 
                                id="admin-custom-time" 
                                className="w-4 h-4 text-fuchsia-600 rounded border-slate-600 bg-slate-800 focus:ring-fuchsia-500"
                                checked={isCustomTime}
                                onChange={(e) => {
                                    setIsCustomTime(e.target.checked);
                                    setTime(null); 
                                }}
                            />
                            <label htmlFor="admin-custom-time" className="text-xs text-slate-400 font-medium cursor-pointer select-none">
                                Horário Personalizado
                            </label>
                        </div>
                   </div>

                   {isCustomTime ? (
                       <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-xl flex gap-2 justify-center items-center">
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
                   ) : (
                       availableSlots.length > 0 ? (
                           <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                               {availableSlots.map(slot => {
                                   // Allow if available OR Past (admin override) OR matches current editing time
                                   const isCurrent = bookingToEdit && slot.time === bookingToEdit.appointment_time.slice(0, 5);
                                   const isSelectable = slot.available || slot.reason === 'past' || isCurrent;
                                   
                                   return (
                                       <button
                                          type="button"
                                          key={slot.time}
                                          onClick={() => isSelectable && setTime(slot.time)}
                                          disabled={!isSelectable}
                                          className={`
                                            p-2 rounded-lg text-sm font-bold border transition-all
                                            ${time === slot.time
                                                ? 'bg-fuchsia-600 text-white border-fuchsia-600' 
                                                : slot.available
                                                    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:border-fuchsia-500 hover:text-white hover:bg-slate-700'
                                                    : slot.reason === 'past' || isCurrent
                                                        ? 'bg-yellow-900/10 border-yellow-700/30 text-yellow-600 hover:bg-yellow-900/20'
                                                        : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed opacity-60'}
                                          `}
                                          title={isSelectable ? 'Disponível (ou Ajuste)' : 'Indisponível'}
                                       >
                                           {slot.time.slice(0, 5)}
                                       </button>
                                   );
                               })}
                           </div>
                       ) : (
                           <p className="text-sm text-gray-400 italic">Nenhum horário disponível (use Hora Personalizada se necessário).</p>
                       )
                   )}
                </div>
            )}

        </div>

        <div className="p-6 border-t border-slate-800 flex gap-3">
            <button 
                onClick={onClose}
                type="button"
                className="flex-1 py-3 text-slate-400 font-bold hover:bg-slate-800 rounded-xl transition-colors"
                disabled={loading}
            >
                Cancelar
            </button>
            <button 
                onClick={handleSubmit}
                type="button"
                disabled={loading || !time || !clientName}
                className="flex-1 py-3 bg-fuchsia-600 text-white font-bold rounded-xl hover:bg-fuchsia-700 transition-colors disabled:opacity-50"
            >
                {loading ? 'Salvando...' : (bookingToEdit ? 'Atualizar' : 'Confirmar Agendamento')}
            </button>
        </div>
      </div>
    </div>
  );
}
