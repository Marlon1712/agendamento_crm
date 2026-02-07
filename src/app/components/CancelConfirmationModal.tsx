'use client';

import { useState, useEffect } from 'react';

interface CancelConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

const reasons = [
  { value: 'client_request', label: 'Solicitação do Cliente' },
  { value: 'personal_reason', label: 'Motivos Pessoais' },
  { value: 'no_show', label: 'Cliente não compareceu' },
  { value: 'scheduling_error', label: 'Erro no Agendamento' },
  { value: 'other', label: 'Outro' }
];

export default function CancelConfirmationModal({ isOpen, onClose, onConfirm }: CancelConfirmationModalProps) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) setReason('');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" style={{ zIndex: 2147483647 }}>
      <div className="w-full max-w-md bg-[#f8f6f6] dark:bg-[#221510] text-[#1b110d] dark:text-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 pb-2 sticky top-0 z-10 bg-[#f8f6f6] dark:bg-[#221510]">
          <button onClick={onClose} className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            ✕
          </button>
          <h2 className="text-lg font-bold leading-tight flex-1 text-center pr-10">Confirmar Cancelamento</h2>
        </div>

        <div className="px-4 pt-2 pb-6">
          <h2 className="text-[24px] font-bold leading-tight text-center pb-3 pt-4">
            Deseja realmente cancelar este atendimento?
          </h2>
          <p className="text-[#6b5145] dark:text-[#d1c2bc] text-base leading-relaxed text-center pb-6">
            Esta ação não pode ser desfeita. Por favor, selecione o motivo do cancelamento abaixo para prosseguir.
          </p>

          <label className="flex flex-col w-full">
            <p className="text-base font-medium pb-2">Motivo do cancelamento</p>
            <div className="relative">
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full appearance-none rounded-xl text-[#1b110d] dark:text-white dark:bg-[#3a2822] focus:outline-0 focus:ring-2 focus:ring-[#ee5f2b]/50 border border-[#e7d6cf] dark:border-[#5a4238] bg-white focus:border-[#ee5f2b] h-14 pl-4 pr-10 text-base shadow-sm transition-all"
              >
                <option disabled value="">Selecione um motivo</option>
                {reasons.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#9a614c] dark:text-[#d1c2bc]">
                ▾
              </div>
            </div>
          </label>

          <div className="flex flex-col gap-3 pt-6">
            <button
              onClick={() => reason && onConfirm(reason)}
              disabled={!reason}
              className="flex w-full items-center justify-center rounded-xl h-14 px-5 bg-[#ee5f2b] hover:bg-[#d65223] text-white text-base font-bold tracking-[0.015em] transition-all active:scale-[0.98] shadow-md shadow-[#ee5f2b]/20 disabled:opacity-50"
            >
              Confirmar Cancelamento
            </button>
            <button
              onClick={onClose}
              className="flex w-full items-center justify-center rounded-xl h-14 px-5 bg-[#f3eae7] dark:bg-[#3a2822] hover:bg-[#ebdcd6] dark:hover:bg-[#4a352e] text-[#1b110d] dark:text-white text-base font-bold tracking-[0.015em] transition-all active:scale-[0.98]"
            >
              Manter Agendamento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
