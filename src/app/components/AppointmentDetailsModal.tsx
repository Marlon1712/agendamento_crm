'use client';

import { CheckCircle, Calendar, Clock, Scissors, User, X, CalendarDays, Ban, MessageCircle } from 'lucide-react';

type AppointmentLead = {
  id: number;
  name?: string;
  client_name?: string;
  contact?: string;
  status?: string;
  price?: string | number;
  appointment_date?: string;
  appointment_time?: string;
  end_time?: string;
  procedure_name?: string;
  procedure_duration?: number;
};

interface AppointmentDetailsModalProps {
  isOpen: boolean;
  lead: AppointmentLead | null;
  onClose: () => void;
  onEdit: () => void;
  onReschedule: () => void;
  onCancel: () => void;
}

const formatDateLong = (value?: string) => {
  if (!value) return '-';
  const d = value.includes('T') ? value.split('T')[0] : value;
  const date = new Date(`${d}T12:00:00`);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatTime = (value?: string) => {
  if (!value) return '--:--';
  return value.slice(0, 5);
};

export default function AppointmentDetailsModal({
  isOpen,
  lead,
  onClose,
  onEdit,
  onReschedule,
  onCancel
}: AppointmentDetailsModalProps) {
  if (!isOpen || !lead) return null;

  const clientName = lead.client_name || lead.name || 'Cliente';
  const status = lead.status || 'agendado';
  const statusLabel = status === 'agendado'
    ? 'Confirmado'
    : status === 'pendente'
      ? 'Pendente'
      : status === 'cancelado'
        ? 'Cancelado'
        : 'Realizado';
  const statusClasses = status === 'agendado'
    ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
    : status === 'pendente'
      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
      : status === 'cancelado'
        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
        : 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800';

  const price = lead.price !== undefined && lead.price !== null ? Number(lead.price) : 0;
  const endTime = lead.end_time ? formatTime(lead.end_time) : '';
  const timeRange = endTime ? `${formatTime(lead.appointment_time)} - ${endTime}` : formatTime(lead.appointment_time);

  return (
    <div className="fixed inset-0 z-[2147483647] flex items-end justify-center bg-black/60 backdrop-blur-md" style={{ zIndex: 2147483647 }}>
      <div className="w-full max-w-md bg-[#120b12] text-white rounded-t-3xl shadow-2xl overflow-hidden border border-fuchsia-500/20 relative">
        <div className="sticky top-0 z-10 flex w-full flex-col items-center bg-[#120b12] pt-2 pb-1">
          <div className="h-1.5 w-12 rounded-full bg-black/10 dark:bg-white/20"></div>
        </div>

        <div className="px-6 pt-3 text-center">
          <h2 className="text-[22px] font-bold tracking-tight text-white">Detalhes do Agendamento</h2>
        </div>

        <div className="flex justify-center w-full py-4">
          <div className={`flex h-9 items-center justify-center gap-x-2 rounded-full px-4 border ${statusClasses}`}>
            <CheckCircle size={18} />
            <p className="text-sm font-medium">{statusLabel}</p>
          </div>
        </div>

        <div className="text-center px-4 pb-6">
          <h1 className="text-[#ee2b7c] tracking-tight text-[36px] font-bold leading-tight">
            R$ {price.toFixed(2).replace('.', ',')}
          </h1>
          <p className="text-white/60 text-sm">Valor total estimado</p>
        </div>

        <div className="px-4">
          <div className="bg-[#1b121b] rounded-2xl p-5 shadow-sm border border-[#2a1822]">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                <User size={18} className="text-white/60" />
              </div>
              <div>
                <p className="text-xs text-white/60 uppercase tracking-wide font-medium">Cliente</p>
                <p className="text-lg font-semibold text-white">{clientName}</p>
              </div>
            </div>

            <div className="h-px bg-white/10 w-full mb-5"></div>

            <div className="grid grid-cols-1 gap-y-5">
              <div className="flex gap-3 items-start">
                <div className="bg-[#ee2b7c]/15 p-2 rounded-lg text-[#ee2b7c]">
                  <Scissors size={16} />
                </div>
                <div>
                  <p className="text-white/60 text-sm font-normal">Serviço</p>
                  <p className="text-base font-medium text-white">{lead.procedure_name || 'Procedimento'}</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="bg-[#ee2b7c]/15 p-2 rounded-lg text-[#ee2b7c]">
                  <CalendarDays size={16} />
                </div>
                <div>
                  <p className="text-white/60 text-sm font-normal">Data e Hora</p>
                  <p className="text-base font-medium text-white">{formatDateLong(lead.appointment_date)}</p>
                  <p className="text-base font-medium text-white">{timeRange}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-[#120b12] border-t border-white/10">
          <div className="grid grid-cols-3 gap-3">
            <button onClick={onEdit} className="flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-xl bg-[#1b121b] hover:bg-[#261a24] border border-white/10 transition-colors group">
              <Calendar size={18} className="text-white/70 group-hover:text-[#ee2b7c]" />
              <span className="text-xs font-medium text-white/70">Editar</span>
            </button>
            <button onClick={onReschedule} className="flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-xl bg-[#1b121b] hover:bg-[#261a24] border border-white/10 transition-colors group">
              <Clock size={18} className="text-white/70 group-hover:text-[#ee2b7c]" />
              <span className="text-xs font-medium text-white/70">Reagendar</span>
            </button>
            <button onClick={onCancel} className="flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-xl bg-[#1b121b] hover:bg-red-900/10 border border-white/10 transition-colors group">
              <Ban size={18} className="text-red-500 group-hover:text-red-600" />
              <span className="text-xs font-medium text-red-500 group-hover:text-red-600">Cancelar</span>
            </button>
          </div>

          <button className="mt-4 w-full bg-[#ee2b7c] hover:bg-[#d61f6b] text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors">
            <MessageCircle size={18} />
            <span>Mensagem via WhatsApp</span>
          </button>
        </div>

        <div className="h-4 bg-[#120b12]" />
        <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
