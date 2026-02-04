'use client';

import { useState, useEffect, TouchEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminBookingModal from '@/app/components/AdminBookingModal';
import ConfirmationModal from '@/app/components/ConfirmationModal';
import RescheduleModal from '@/app/components/RescheduleModal';
import { ChevronLeft, ChevronRight, Plus, RotateCcw } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';

export default function CalendarDashboard() {
  const { toggleSidebar, isOpen: isSidebarOpen } = useSidebar();
  const { data: session } = useSession();
  const router = useRouter();
  const [leads, setLeads] = useState<any[]>([]);
  
  // Helper for Local Date YYYY-MM-DD
  const getLocalDate = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState<any>(null); // EDIT MODE STATE
  
  const [selectedDay, setSelectedDay] = useState<string | null>(null); // YYYY-MM-DD
  const [expandedNotesId, setExpandedNotesId] = useState<number | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [showDeleteForId, setShowDeleteForId] = useState<number | null>(null);

  // Swipe State
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Swipe Handlers
  const minSwipeDistance = 50;
  const onTouchStart = (e: React.TouchEvent) => {
      setTouchEnd(null);
      setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
      if (!touchStart || !touchEnd) return;
      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > minSwipeDistance;
      const isRightSwipe = distance < -minSwipeDistance;
      
      if (isLeftSwipe) {
          nextMonth();
      } else if (isRightSwipe) {
          prevMonth();
      }
  };


  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: 'realizado' | 'cancelado' | 'agendado' | 'excluir' | null;
    id: number | null;
  }>({ isOpen: false, type: null, id: null });

  const [rescheduleModal, setRescheduleModal] = useState<{
    isOpen: boolean;
    lead: any | null;
  }>({ isOpen: false, lead: null });

  const [notesModal, setNotesModal] = useState<{
    isOpen: boolean;
    lead: any | null;
    notes: string;
  }>({ isOpen: false, lead: null, notes: '' });

  const confirmAction = (id: number, type: 'realizado' | 'cancelado' | 'agendado' | 'excluir') => {
    setModal({ isOpen: true, id, type });
  };

  const handleUpdate = async () => {
    if (!modal.id || !modal.type) return;
    try {
        if (modal.type === 'excluir') {
             await fetch(`/api/leads/${modal.id}/delete`, { method: 'DELETE' });
             setLeads(leads.filter(l => l.id !== modal.id));
        } else {
            await fetch(`/api/leads/${modal.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: modal.type }),
                headers: { 'Content-Type': 'application/json' }
            });
            setLeads(leads.map(l => l.id === modal.id ? { ...l, status: modal.type } : l));
        }
    } catch (e) {
        alert('Erro ao atualizar');
    } finally {
        setModal({ isOpen: false, id: null, type: null });
    }
  };

  const handleReschedule = async (date: string, time: string, procedureId?: number) => {
    if (!rescheduleModal.lead) return;
    try {
        await fetch(`/api/leads/${rescheduleModal.lead.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ appointmentDate: date, appointmentTime: time, procedureId }),
            headers: { 'Content-Type': 'application/json' }
        });
        
        // Update local state deeply
        setLeads(leads.map(l => {
             if (l.id === rescheduleModal.lead.id) {
                 return { ...l, appointment_date: date, appointment_time: time, status: 'agendado' };
             }
             return l;
        }));
        setRescheduleModal({ isOpen: false, lead: null });
    } catch (e) {
        alert('Erro ao reagendar');
    }
  };

  const saveNotes = async () => {
      if (!notesModal.lead) return;
      try {
          await fetch(`/api/leads/${notesModal.lead.id}/notes`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ admin_notes: notesModal.notes })
          });
          setLeads(leads.map(l => l.id === notesModal.lead.id ? { ...l, admin_notes: notesModal.notes } : l));
          setNotesModal({ isOpen: false, lead: null, notes: '' });
      } catch (error) {
          alert('Erro ao salvar notas');
      }
  };

  // --- LONG PRESS HANDLER FOR EDIT MODE ---
  const handleLongPress = (lead: any) => {
      setBookingToEdit(lead);
      setIsCreateModalOpen(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
  };

  useEffect(() => {
    fetch('/api/leads/list')
      .then((res) => {
        if (res.status === 401) {
            router.push('/admin/login');
            throw new Error('Unauthorized');
        }
        return res.json();
      })
      .then((data) => {
        if (data.leads) setLeads(data.leads);
      })
      .finally(() => setLoading(false));
  }, [router]);

  // Calendar Logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
  
  const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const gridCells = [];
  // Padding
  for (let i = 0; i < firstDayOfMonth; i++) {
      gridCells.push(<div key={`empty-${i}`} className="bg-transparent min-h-[100px]"></div>);
  }
  
  // Days
  for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
      const dayLeads = leads.filter(l => l.appointment_date.split('T')[0] === dateStr);
      dayLeads.sort((a, b) => (a.appointment_time || '').localeCompare(b.appointment_time || ''));

      const isToday = getLocalDate() === dateStr;

      gridCells.push(
          <div 
            key={i} 
            onClick={() => setSelectedDay(dateStr)}
            className={`
                min-h-[90px] md:min-h-[130px] p-[2px] relative group cursor-pointer transition-all duration-200
                bg-[#18181b] rounded-md border border-white/5 hover:border-white/10 hover:bg-[#202024]
            `}
          >
              <div className="flex justify-center mb-[2px]">
                  <span className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'bg-fuchsia-600 text-white shadow-sm' : 'text-zinc-500'}`}>
                      {i}
                  </span>
              </div>
              
              <div className="flex flex-col gap-[1px] overflow-hidden">
                  {dayLeads.slice(0, 5).map(lead => {
                      // Status Color Mapping
                      let bgClass = 'bg-zinc-800 text-zinc-300'; 
                      if (lead.status === 'realizado') bgClass = 'bg-emerald-600/90 text-white';
                      else if (lead.status === 'agendado') bgClass = 'bg-blue-600/90 text-white';
                      else if (lead.status === 'confirmado') bgClass = 'bg-indigo-600/90 text-white';
                      else if (lead.status === 'cancelado') bgClass = 'bg-red-600/90 text-white';
                      else if (lead.status === 'pendente') bgClass = 'bg-orange-500 text-white'; 
                      else if (lead.name.toLowerCase().includes('terapia')) bgClass = 'bg-fuchsia-600/90 text-white';
                      
                      return (
                          <div 
                            key={lead.id} 
                            className={`
                                px-[2px] rounded-[2px] shadow-sm text-[8px] font-medium truncate leading-none py-[1px] tracking-tight mb-[1px] flex items-center justify-center text-center
                                ${bgClass}
                            `}
                          >
                              {lead.name.split(' ')[0]}
                          </div>
                      );
                  })}
                  {dayLeads.length > 5 && (
                      <div className="text-[7px] text-zinc-600 font-bold text-center leading-none mt-[1px]">...</div>
                  )}
              </div>
          </div>
      );
  }

  // Determine selected day leads
  const selectedDayLeads = selectedDay 
    ? leads.filter(l => l.appointment_date.split('T')[0] === selectedDay) 
        .sort((a,b) => (a.appointment_time||'').localeCompare(b.appointment_time||''))
    : [];

  const selectedDateObj = selectedDay ? new Date(selectedDay + 'T00:00:00') : null;


  return (
    <div 
      className="h-[calc(100vh+2rem)] md:h-[calc(100vh+4rem)] flex flex-col bg-[#121212] overflow-hidden relative -m-4 md:-m-8 w-[calc(100%+2rem)] md:w-[calc(100%+4rem)]"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      
      {/* Header - Minimalist Centered Title Only (No Box) */}
      <header className="relative flex items-center justify-center py-4 bg-[#121212] shrink-0 border-b border-white/5">
          <div className="flex items-center gap-6">
               <button onClick={prevMonth} className="p-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"><ChevronLeft size={20}/></button>
               <h1 className="text-base font-bold text-white uppercase tracking-widest min-w-[120px] text-center">
                  {MONTHS[month]} <span className="text-zinc-500">{year}</span>
               </h1>
               <button onClick={nextMonth} className="p-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"><ChevronRight size={20}/></button>
          </div>
          
          <button 
            onClick={goToToday} 
            className="absolute right-4 p-2 rounded-full hover:bg-white/10 text-zinc-500 hover:text-fuchsia-400 transition-colors" 
            title="Voltar para Hoje"
          >
               <RotateCcw size={18} />
          </button>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
          {/* Main Grid */}
          <main className="flex-1 overflow-y-auto pb-4 bg-[#121212] px-[1px] md:px-1">
              {/* Day Names Header */}
              <div className="grid grid-cols-7 mb-1 sticky top-0 bg-[#121212] z-10 pt-2 pb-2 border-b border-white/5">
                  {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'].map(day => (
                      <div key={day} className={`text-center text-xs font-semibold uppercase tracking-wider ${day === 'seg' ? 'text-blue-400' : 'text-zinc-500'}`}>
                          {day}.
                      </div>
                  ))}
              </div>
              {/* Calendar Cells */}
              <div className="grid grid-cols-7 auto-rows-fr bg-[#121212] gap-1">
                  {gridCells}
              </div>
          </main>
      </div>

      {/* Main View FABs - Conditional Visibility */}
      {!isSidebarOpen && !isCreateModalOpen && (
        <button
            onClick={() => setIsCreateModalOpen(true)}
            className="fixed bottom-6 right-6 w-10 h-10 bg-fuchsia-600 hover:bg-fuchsia-700 rounded-xl flex items-center justify-center text-white shadow-xl z-[90] transition-all active:scale-95 shadow-fuchsia-900/20"
        >
            <Plus size={20} />
        </button>
      )}

      {/* Day Details Modal */}
      {selectedDay && (
          <div className="fixed inset-0 z-[60] flex items-center justify-end bg-black/70 backdrop-blur-sm" onClick={() => setSelectedDay(null)}>
              <div 
                className="bg-slate-900 h-full w-full max-w-md shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col relative border-l border-slate-800"
                onClick={e => e.stopPropagation()}
              >
                  {/* Header */}
                  <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-fuchsia-900/10">
                      <div>
                          <p className="text-xs font-bold text-fuchsia-400 uppercase tracking-widest mb-1">Agendamentos</p>
                          <h3 className="text-2xl font-bold text-white capitalize">
                              {selectedDateObj?.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric' })}
                          </h3>
                      </div>
                      <button onClick={() => setSelectedDay(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                          ✕
                      </button>
                  </div>

                  {/* List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950 pb-20">
                      {selectedDayLeads.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                              <span className="text-4xl mb-2">😴</span>
                              <p>Sem agendamentos.</p>
                          </div>
                      ) : (
                          selectedDayLeads.map(lead => (
                              <div 
                                key={lead.id} 
                                // Integrated Long Press handling here for ALL cards
                                onMouseDown={() => {
                                    const timer = setTimeout(() => handleLongPress(lead), 5000); // 5s Long Press
                                    setLongPressTimer(timer);
                                }}
                                onMouseUp={() => longPressTimer && clearTimeout(longPressTimer)}
                                onMouseLeave={() => longPressTimer && clearTimeout(longPressTimer)}
                                onTouchStart={() => {
                                    const timer = setTimeout(() => handleLongPress(lead), 5000); // 5s Long Press
                                    setLongPressTimer(timer);
                                }}
                                onTouchEnd={() => longPressTimer && clearTimeout(longPressTimer)}
                                
                                onClick={(e) => {
                                    // Toggle notes on click
                                    setExpandedNotesId(expandedNotesId === lead.id ? null : lead.id);
                                }}
                                className={`
                                    bg-slate-900 rounded-2xl shadow-lg border border-slate-800 overflow-hidden transition-all duration-300 relative select-none
                                    ${expandedNotesId === lead.id ? 'ring-2 ring-fuchsia-500/50 shadow-xl' : 'hover:border-slate-700'}
                                    active:scale-[0.98]
                                `}
                              >
                                  {/* Status Badge (Absolute Top Right) */}
                                  <span className={`
                                      absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase text-white rounded-bl-2xl shadow-sm z-10
                                      ${lead.status === 'realizado' ? 'bg-emerald-600' : 
                                        lead.status === 'agendado' ? 'bg-blue-600' : 
                                        lead.status === 'cancelado' ? 'bg-red-600' :
                                        'bg-orange-500'}
                                  `}>
                                      {lead.status === 'realizado' ? 'Realizado' : 
                                       lead.status === 'agendado' ? 'Agendado' : 
                                       lead.status === 'cancelado' ? 'Cancelado' : 'Pendente'}
                                  </span>

                                  {/* Card Header (Time) */}
                                  <div className="p-4 pb-2 flex justify-between items-start mt-2">
                                      <div className="flex flex-col">
                                          <span className="text-2xl font-black text-white leading-none">
                                              {lead.appointment_time?.slice(0,5)}
                                          </span>
                                          <span className="text-[10px] text-slate-500 font-bold uppercase mt-1">Horário</span>
                                      </div>
                                  </div>

                                  {/* Card Body (Info) */}
                                  <div className="px-4 py-2">
                                      <h4 className="font-bold text-white text-lg leading-tight">{lead.name}</h4>
                                      <p className="text-slate-400 text-sm mb-1">{lead.contact}</p>
                                      <div className="flex justify-between items-center text-sm font-medium text-slate-300 bg-slate-800 p-2 rounded-lg mt-2 border border-slate-700">
                                          <span>{lead.procedure_name}</span>
                                          <span className="font-bold text-fuchsia-400">R$ {lead.price}</span>
                                      </div>
                                  </div>

                                  {/* Notes (Toggle) */}
                                  {(lead.admin_notes || expandedNotesId === lead.id) && (
                                      <div className={`px-4 pb-2 animate-in slide-in-from-top-1 duration-200 ${expandedNotesId === lead.id ? 'block' : 'hidden'}`}>
                                          <div className="bg-yellow-900/20 p-2 rounded-lg text-xs text-yellow-200 border border-yellow-900/30 flex gap-2">
                                              <span>📝</span>
                                              <p className="italic">{lead.admin_notes || 'Sem observações.'}</p>
                                          </div>
                                      </div>
                                  )}

                                  {/* Actions Bar */}
                                  <div className="px-2 py-2 bg-slate-800/50 border-t border-slate-800 flex justify-around items-center gap-1 mt-2">
                                      
                                      {/* Common: Notes & Reschedule */}
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); setNotesModal({ isOpen: true, lead: lead, notes: lead.admin_notes || '' }); }}
                                        className="p-2 text-slate-400 hover:text-yellow-400 hover:bg-yellow-900/20 rounded-lg transition-colors"
                                      >
                                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                                      </button>

                                      {(lead.status === 'agendado' || lead.status === 'pendente') && (
                                          <button 
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setRescheduleModal({ isOpen: true, lead: lead }); }}
                                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors"
                                          >
                                               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                                          </button>
                                       )}

                                      {/* PENDENTE: Approve or Reject (Delete) */}
                                      {lead.status === 'pendente' && (
                                          <>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); confirmAction(lead.id, 'agendado'); }}
                                                className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-900/20 rounded-lg transition-colors"
                                                title="Aprovar (Tornar Agendado)"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); confirmAction(lead.id, 'excluir'); }}
                                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Rejeitar (Excluir)"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                          </>
                                      )}

                                      {/* AGENDADO: Confirm (if Today/Past) or Cancel */}
                                      {lead.status === 'agendado' && (
                                          <>
                                            {/* Confirm Button Logic (Date < Today OR (Date == Today AND Time <= Now)) */}
                                            {(() => {
                                                const today = getLocalDate();
                                                const leadDate = lead.appointment_date.toString().split('T')[0];
                                                if (leadDate < today) return true; // Past day
                                                if (leadDate > today) return false; // Future day
                                                
                                                // Today: check time
                                                const now = new Date();
                                                const currentHm = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
                                                const leadHm = (lead.appointment_time || '23:59').slice(0, 5);
                                                return leadHm <= currentHm;
                                            })() ? (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); confirmAction(lead.id, 'realizado'); }}
                                                    className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-900/20 rounded-lg transition-colors"
                                                    title="Confirmar Presença (Realizado)"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                                </button>
                                            ) : (
                                                <button 
                                                    disabled
                                                    className="p-2 text-slate-600 cursor-not-allowed"
                                                    title="Aguardando data do agendamento"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                </button>
                                            )}
                                            {/* Cancel Button */}
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); confirmAction(lead.id, 'cancelado'); }}
                                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Cancelar Agendamento"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </button>
                                          </>
                                      )}

                                      {/* CANCELADO: Delete */}
                                      {lead.status === 'cancelado' && (
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); confirmAction(lead.id, 'excluir'); }}
                                            className="p-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm shadow-red-900/50"
                                            title="Excluir Permanentemente"
                                          >
                                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                          </button>
                                      )}
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
                  
                  {/* Floating Action Menu in Drawer */}

              </div>
          </div>
      )}

      {/* Helper Modals */}
      <ConfirmationModal 
        isOpen={modal.isOpen}
        title={
            modal.type === 'realizado' ? 'Confirmar Presença' : 
            modal.type === 'cancelado' ? 'Confirmar Cancelamento' : 'Confirmar Ação'
        }
        message={
            modal.type === 'realizado' ? 'Marcar como realizado?' : 
            modal.type === 'cancelado' ? 'Deseja realmente cancelar este agendamento?' :
            modal.type === 'excluir' ? 'Deseja apagar permanentemente este registro?' : 'Prosseguir?'
        }
        onConfirm={handleUpdate}
        onCancel={() => setModal({ isOpen: false, id: null, type: null })}
        isDanger={modal.type === 'cancelado' || modal.type === 'excluir'}
        confirmText="Confirmar"
      />

      <RescheduleModal 
        isOpen={rescheduleModal.isOpen}
        onClose={() => setRescheduleModal({ isOpen: false, lead: null })}
        onConfirm={handleReschedule}
        procedureId={rescheduleModal.lead?.procedure_id}
        currentDate={rescheduleModal.lead?.appointment_date || ''}
        currentTime={rescheduleModal.lead?.appointment_time || ''}
        leadId={rescheduleModal.lead?.id}
      />

       {/* Notes Modal */}
       {notesModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    📝 Notas Administrativas
                </h3>
                <textarea 
                    className="w-full h-32 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-fuchsia-500 outline-none resize-none mb-4"
                    placeholder="Observações internas..."
                    value={notesModal.notes}
                    onChange={e => setNotesModal({...notesModal, notes: e.target.value})}
                ></textarea>
                <div className="flex justify-end gap-2">
                    <button 
                        onClick={() => setNotesModal({ isOpen: false, lead: null, notes: '' })}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={saveNotes}
                        className="px-4 py-2 bg-fuchsia-600 text-white rounded-lg font-bold hover:bg-fuchsia-700 shadow-lg shadow-fuchsia-200"
                    >
                        Salvar
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* ADMIN BOOKING MODAL FOR CREATE & EDIT */}
      <AdminBookingModal 
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); setBookingToEdit(null); }}
        initialDate={selectedDay || undefined}
        bookingToEdit={bookingToEdit}
        onSuccess={() => {
            setIsCreateModalOpen(false);
            setBookingToEdit(null);
            fetch('/api/leads/list')
               .then(res => res.json())
               .then(data => { if (data.leads) setLeads(data.leads); });
        }}
      />
    </div>
  );
}
