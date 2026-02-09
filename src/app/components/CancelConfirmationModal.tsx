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
  const [otherReason, setOtherReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setOtherReason('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" style={{ zIndex: 2147483647 }}>
      <div className="w-full max-w-md bg-[#120b12] text-white rounded-2xl shadow-2xl overflow-hidden border border-[#2a1822]">
        <div className="flex items-center justify-between p-4 pb-2 sticky top-0 z-10 bg-[#120b12]/95 backdrop-blur border-b border-[#2a1822]">
          <button onClick={onClose} className="flex size-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors">
            ✕
          </button>
          <h2 className="text-lg font-bold leading-tight flex-1 text-center pr-10">Confirmar Cancelamento</h2>
        </div>

        <div className="px-4 pt-2 pb-6">
          <h2 className="text-[24px] font-bold leading-tight text-center pb-3 pt-4 text-white">
            Deseja realmente cancelar este atendimento?
          </h2>
          <p className="text-white/70 text-base leading-relaxed text-center pb-6">
            Esta ação não pode ser desfeita. Por favor, selecione o motivo do cancelamento abaixo para prosseguir.
          </p>

          <label className="flex flex-col w-full">
            <p className="text-base font-medium pb-2 text-white">Motivo do cancelamento</p>
            <div className="relative">
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full appearance-none rounded-xl text-white bg-[#1b121b] focus:outline-0 focus:ring-2 focus:ring-[#ee2b7c]/50 border border-[#2a1822] focus:border-[#ee2b7c] h-14 pl-4 pr-10 text-base shadow-sm transition-all"
              >
                <option disabled value="">Selecione um motivo</option>
                {reasons.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white/60">
                ▾
              </div>
            </div>
          </label>

          {reason === 'other' && (
            <div className="mt-4">
              <label className="text-sm font-medium text-white">Descreva o motivo</label>
              <textarea
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                placeholder="Digite o motivo do cancelamento..."
                className="mt-2 w-full rounded-xl bg-[#1b121b] border border-[#2a1822] text-white placeholder-white/30 p-3 min-h-[90px] focus:outline-none focus:ring-2 focus:ring-[#ee2b7c]/50 focus:border-[#ee2b7c]"
              />
            </div>
          )}

          <div className="flex flex-col gap-3 pt-6">
            <button
              onClick={() => {
                if (!reason) return;
                const finalReason = reason === 'other' ? `Outro: ${otherReason.trim()}` : reason;
                if (reason === 'other' && !otherReason.trim()) return;
                onConfirm(finalReason);
              }}
              disabled={!reason || (reason === 'other' && !otherReason.trim())}
              className="flex w-full items-center justify-center rounded-xl h-14 px-5 bg-[#ee2b7c] hover:bg-[#d61f6b] text-white text-base font-bold tracking-[0.015em] transition-all active:scale-[0.98] shadow-md shadow-[#ee2b7c]/20 disabled:opacity-50"
            >
              Confirmar Cancelamento
            </button>
            <button
              onClick={onClose}
              className="flex w-full items-center justify-center rounded-xl h-14 px-5 bg-[#1b121b] hover:bg-[#261a24] text-white text-base font-bold tracking-[0.015em] transition-all active:scale-[0.98] border border-[#2a1822]"
            >
              Manter Agendamento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
