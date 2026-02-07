'use client';

import { useState, useEffect } from 'react';
import ConfirmationModal from '../../components/ConfirmationModal';
import { 
    Pencil, 
    Trash2, 
    Search,
    Plus,
    X,
    Check,
    ArrowLeft
} from 'lucide-react';

export default function AdminServices() {
  const [procedures, setProcedures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [serviceColor, setServiceColor] = useState<'pink' | 'blue' | 'green' | 'purple' | 'yellow'>('pink');
  const [onlineEnabled, setOnlineEnabled] = useState(true);
  
  // State for Form
  const [form, setForm] = useState({ 
    name: '', 
    duration: 60, 
    price: 0,
    isPromotional: false,
    promoPrice: '',
    promoStartDate: '',
    promoEndDate: '',
    promoHasDeadline: false, // NEW: Explicit state
    description: '',
    observation: '',
    promoType: 'discount',
    promoGiftItem: '',
    promoSlots: ''
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, id: number | null}>({ isOpen: false, id: null });

  // Drag & Swipe State
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [swipedId, setSwipedId] = useState<number | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchOffset, setTouchOffset] = useState<number>(0);
  
  // Logic
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [scrollToId, setScrollToId] = useState<number | null>(null);

  const fetchProcedures = () => {
    fetch('/api/procedures')
      .then(res => res.json())
      .then(data => {
         if (Array.isArray(data)) setProcedures(data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProcedures();
  }, []);

  // Handle Scroll to Saved Item
  useEffect(() => {
      if (scrollToId && !loading && procedures.length > 0) {
        // slight delay to ensure render
        setTimeout(() => {
            const el = document.getElementById(`service-card-${scrollToId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setScrollToId(null);
            }
        }, 100);
      }
  }, [scrollToId, loading, procedures]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare Payload
    const payload = { ...form };
    
    // Logic: If user unchecked "hasDeadline" (so it is FALSE), ensure date is empty
    if (!payload.promoHasDeadline) {
        payload.promoEndDate = '';
    } else if (payload.promoEndDate && payload.promoEndDate.length === 10) {
        // If has deadline AND date is set, append time
        payload.promoEndDate = `${payload.promoEndDate} 23:59:59`;
    }
    
    // Default Promo Price if empty
    if (payload.isPromotional && (payload.promoPrice === '' || payload.promoPrice === '0')) {
        payload.promoPrice = String(payload.price); 
    }
    
    let newId = 0;
    if (editingId && editingId !== -1) {
        // UPDATE (PUT)
        await fetch(`/api/procedures/${editingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } else {
        // CREATE (POST)
        const res = await fetch('/api/procedures', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        newId = data.id || 0;
    }

    // Handle Insert Logic
    if (insertIndex !== null && newId > 0) {
       // Reorder: insert newId at insertIndex
       const currentIds = procedures.map(p => p.id).filter(id => id !== newId); // existings
       const newOrder = [
           ...currentIds.slice(0, insertIndex),
           newId,
           ...currentIds.slice(insertIndex)
       ];
       
       await fetch('/api/procedures/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: newOrder })
       });
    }

    // Reset & Scroll
    const targetId = editingId && editingId !== -1 ? editingId : newId;
    setScrollToId(targetId);
    
    resetForm();
    fetchProcedures();
  };

  const resetForm = () => {
    setForm({ 
        name: '', 
        duration: 30, 
        price: 0, 
        isPromotional: false, 
        promoPrice: '', 
        promoStartDate: '',
        promoEndDate: '',
        promoHasDeadline: false, // Reset
        description: '',
        observation: '',
        promoType: 'discount',
        promoGiftItem: '',
        promoSlots: ''
    });
    setEditingId(null);
    setInsertIndex(null);
    setShowCalendar(false);
    setShowFormModal(false);
    setServiceColor('pink');
    setOnlineEnabled(true);
  };

  const handleEdit = (proc: any) => {
    setEditingId(proc.id);
    const isPromo = !!proc.is_promotional;
    
    // Check if valid date
    let dateStr = '';
    if (isPromo && proc.promo_end_date) {
        try {
            dateStr = new Date(proc.promo_end_date).toISOString().split('T')[0];
        } catch (e) {}
    }

    setForm({ 
        name: proc.name, 
        duration: proc.duration_minutes, 
        price: proc.price,
        isPromotional: isPromo,
        promoPrice: proc.promo_price || '',
        promoStartDate: proc.promo_start_date ? new Date(proc.promo_start_date).toISOString().split('T')[0] : '',
        promoEndDate: dateStr,
        promoHasDeadline: !!dateStr, // Set based on existing data
        description: proc.description || '',
        observation: proc.observation || '',
        promoType: proc.promo_type || 'discount',
        promoGiftItem: proc.promo_gift_item || '',
        promoSlots: proc.promo_slots || ''
    });

    // Scroll removed
    setShowCalendar(false);
    setShowFormModal(true);
  };

  const handleDelete = async (id: number) => {
    // Check handled by Modal
    await fetch(`/api/procedures/${id}`, { method: 'DELETE' });
    setDeleteModal({ isOpen: false, id: null });
    fetchProcedures();
  };

  const handleCreate = () => {
      resetForm();
      setEditingId(-1); // -1 marks "New"
      // Scroll removed
      setShowFormModal(true);
  };

  const cancelEdit = () => {
      setEditingId(null);
      resetForm();
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
      setDraggedItem(index);
      e.dataTransfer.effectAllowed = 'move';
      // Transparent ghost image if desired, but default is fine
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (draggedItem === null || draggedItem === index) return;
      
      const newProcedures = [...procedures];
      const items = newProcedures.splice(draggedItem, 1);
      newProcedures.splice(index, 0, items[0]);
      
      setProcedures(newProcedures);
      setDraggedItem(index);
  };

  const handleDragEnd = async () => {
      setDraggedItem(null);
      // Sync Order
      const orderIds = procedures.map(p => p.id);
      await fetch('/api/procedures/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: orderIds })
      });
  };

  // Swipe Handlers
  const onTouchStart = (e: React.TouchEvent, id: number) => {
      setSwipedId(id);
      setTouchOffset(0);
      setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => {
      if (touchStart === null) return;
      const current = e.targetTouches[0].clientX;
      const diff = current - touchStart;
      setTouchOffset(diff);
  };
  const onTouchEnd = (id: number) => {
      if (touchStart === null) return;
      
      const threshold = -80; 
      if (touchOffset < threshold) {
          setDeleteModal({ isOpen: true, id });
      }
      
      setSwipedId(null);
      setTouchStart(null);
      setTouchOffset(0);
  };

  const renderForm = (isNew: boolean = false) => (
    <div className="bg-transparent w-full h-full flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-[#1b0d13] dark:text-gray-200 text-base font-medium leading-normal">
            Nome do Serviço
          </label>
          <input
            className="form-input flex w-full min-w-0 resize-none overflow-hidden rounded-xl border border-[#e7cfd9] dark:border-[#5e3a4b] bg-white dark:bg-[#2d1520] h-14 p-[15px] text-base font-normal leading-normal text-[#1b0d13] dark:text-white placeholder:text-[#9a4c6c] dark:placeholder:text-[#d48fa8] focus:outline-0 focus:ring-2 focus:ring-[#ee2b7c]/20 focus:border-[#ee2b7c] transition-all shadow-sm"
            placeholder="Ex: Pedicure Express"
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[#1b0d13] dark:text-gray-200 text-base font-medium leading-normal">
            Descrição <span className="text-sm font-normal text-[#9a4c6c] dark:text-[#d48fa8] ml-1">(Opcional)</span>
          </label>
          <textarea
            className="form-input flex w-full min-w-0 resize-none overflow-hidden rounded-xl border border-[#e7cfd9] dark:border-[#5e3a4b] bg-white dark:bg-[#2d1520] min-h-[120px] p-[15px] text-base font-normal leading-normal text-[#1b0d13] dark:text-white placeholder:text-[#9a4c6c] dark:placeholder:text-[#d48fa8] focus:outline-0 focus:ring-2 focus:ring-[#ee2b7c]/20 focus:border-[#ee2b7c] transition-all shadow-sm"
            placeholder="Detalhes sobre o procedimento, produtos usados..."
            value={form.description || ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[#1b0d13] dark:text-gray-200 text-base font-medium leading-normal">
            Preço (R$)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9a4c6c] dark:text-[#d48fa8] font-medium">R$</span>
            <input
              className="form-input flex w-full min-w-0 resize-none overflow-hidden rounded-xl border border-[#e7cfd9] dark:border-[#5e3a4b] bg-white dark:bg-[#2d1520] h-14 pl-12 pr-4 text-base font-normal leading-normal text-[#1b0d13] dark:text-white placeholder:text-[#9a4c6c] dark:placeholder:text-[#d48fa8] focus:outline-0 focus:ring-2 focus:ring-[#ee2b7c]/20 focus:border-[#ee2b7c] transition-all shadow-sm"
              placeholder="0,00"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-[#1b0d13] dark:text-gray-200 text-base font-medium leading-normal">
            Duração Estimada
          </h3>
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
            {[15, 30, 45, 60, 90].map((m) => (
              <label key={m} className="cursor-pointer group">
                <input
                  className="peer sr-only"
                  name="duration"
                  type="radio"
                  value={m}
                  checked={form.duration === m}
                  onChange={() => setForm({ ...form, duration: m })}
                />
                <div className="px-5 py-2.5 rounded-full border border-[#e7cfd9] dark:border-[#5e3a4b] bg-white dark:bg-[#2d1520] text-[#1b0d13] dark:text-white text-sm font-medium transition-all peer-checked:bg-[#ee2b7c] peer-checked:text-white peer-checked:border-[#ee2b7c] group-hover:border-[#ee2b7c]/50 whitespace-nowrap shadow-sm">
                  {m === 60 ? '1 h' : m === 90 ? '1h 30m' : `${m} min`}
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="h-px bg-[#e7cfd9]/50 dark:bg-white/10 w-full" />

        <div className="flex flex-col gap-3">
          <h3 className="text-[#1b0d13] dark:text-gray-200 text-base font-medium leading-normal">
            Cor na Agenda
          </h3>
          <div className="flex gap-4 items-center justify-start flex-wrap">
            {[
              { key: 'pink', color: '#ffb7d5', check: '#ee2b7c' },
              { key: 'blue', color: '#b7d5ff', check: '#3b82f6' },
              { key: 'green', color: '#b7ffce', check: '#22c55e' },
              { key: 'purple', color: '#e0b7ff', check: '#a855f7' },
              { key: 'yellow', color: '#fffab7', check: '#eab308' }
            ].map((c) => (
              <label key={c.key} className="cursor-pointer relative">
                <input
                  className="peer sr-only"
                  name="color"
                  type="radio"
                  value={c.key}
                  checked={serviceColor === c.key}
                  onChange={() => setServiceColor(c.key as any)}
                />
                <div
                  className="size-11 rounded-full transition-transform hover:scale-110 peer-checked:ring-2 peer-checked:ring-offset-2 peer-checked:ring-[#ee2b7c] dark:peer-checked:ring-offset-[#221018] flex items-center justify-center"
                  style={{ backgroundColor: c.color }}
                >
                  <Check size={18} className="opacity-0 peer-checked:opacity-100" style={{ color: c.check }} />
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="flex flex-col">
            <span className="text-[#1b0d13] dark:text-gray-200 text-base font-medium">Agendamento Online</span>
            <span className="text-[#9a4c6c] dark:text-[#d48fa8] text-sm">Visível para clientes no app</span>
          </div>
          <label className="inline-flex items-center cursor-pointer">
            <input
              className="sr-only peer"
              type="checkbox"
              checked={onlineEnabled}
              onChange={(e) => setOnlineEnabled(e.target.checked)}
            />
            <div className="relative w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#ee2b7c]/20 dark:peer-focus:ring-[#ee2b7c]/30 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-[#ee2b7c]" />
          </label>
        </div>

        <button
          type="submit"
          className="mt-2 flex w-full items-center justify-center rounded-xl bg-[#ee2b7c] h-14 px-4 text-white text-base font-bold shadow-lg shadow-[#ee2b7c]/30 hover:bg-[#d81f6f] active:scale-[0.98] transition-all"
        >
          Salvar Serviço
        </button>
      </form>
    </div>
  );

  const filteredProcedures = procedures.filter((proc) =>
    proc.name?.toLowerCase().includes(search.toLowerCase())
  );

  const getServiceImage = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('pedicure') || lower.includes('pé')) {
      return "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=800&auto=format&fit=crop";
    }
    if (lower.includes('alongamento') || lower.includes('gel')) {
      return "https://images.unsplash.com/photo-1519415943484-9fa1873496d4?q=80&w=800&auto=format&fit=crop";
    }
    if (lower.includes('spa')) {
      return "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=800&auto=format&fit=crop";
    }
    return "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800&auto=format&fit=crop";
  };

  return (
    <div className="bg-[#f8f6f7] dark:bg-[#221018] min-h-screen text-gray-900 dark:text-gray-100 flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#f8f6f7]/95 dark:bg-[#221018]/95 backdrop-blur-sm border-b border-gray-100 dark:border-white/5 px-4 py-3 flex items-center justify-between">
        <button
          aria-label="Voltar"
          className="flex items-center justify-center p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-800 dark:text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-2">
          Gestão de Serviços
        </h1>
        <button
          onClick={() => {
            resetForm();
            setEditingId(-1);
            setInsertIndex(0);
            setShowFormModal(true);
          }}
          className="flex items-center justify-end text-[#ee2b7c] text-sm font-bold tracking-wide hover:opacity-80 transition-opacity"
        >
          Criar
        </button>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-20 pb-24 flex flex-col gap-6 overflow-y-auto">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-gray-500">
            <Search size={18} />
          </span>
          <input
            className="w-full bg-white dark:bg-[#2f1b25] border-none rounded-xl py-3 pl-10 pr-4 text-sm font-medium shadow-sm placeholder-gray-400 focus:ring-2 focus:ring-[#ee2b7c]/50 outline-none transition-all"
            placeholder="Buscar serviço..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {(editingId !== null) && (
          <div className="rounded-2xl border border-[#ee2b7c]/20 bg-white dark:bg-[#2f1b25] shadow-sm p-4">
            {renderForm(true)}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {filteredProcedures.map((proc: any, index: number) => (
            <article
              key={proc.id}
              id={`service-card-${proc.id}`}
              className="group relative overflow-hidden rounded-xl bg-white dark:bg-[#2f1b25] p-4 shadow-sm hover:shadow-md transition-all border border-transparent hover:border-[#ee2b7c]/10 dark:border-white/5"
            >
              <div className="flex items-start gap-4">
                <div className="flex flex-col flex-[2_2_0px] gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#ee2b7c] shadow-[0_0_8px_rgba(238,43,124,0.4)]" />
                    <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                      {proc.name}
                    </h3>
                  </div>
                  <p className="text-[#ee2b7c] text-sm font-medium leading-normal flex items-center gap-1">
                    R$ {parseFloat(proc.price).toFixed(2)}
                    <span className="text-gray-400 dark:text-gray-500">•</span>
                    <span className="text-gray-500 dark:text-gray-400 font-normal">
                      {proc.duration_minutes} min
                    </span>
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => handleEdit(proc)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-[#ee2b7c]/10 hover:text-[#ee2b7c] text-gray-600 dark:text-gray-300 text-xs font-semibold transition-colors"
                    >
                      <Pencil size={14} />
                      Editar
                    </button>
                    <button
                      aria-label="Excluir serviço"
                      onClick={() => setDeleteModal({ isOpen: true, id: proc.id })}
                      className="flex items-center justify-center p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 text-gray-400 dark:text-gray-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div
                  className="w-24 h-24 shrink-0 rounded-lg bg-gray-200 dark:bg-gray-800 bg-center bg-cover shadow-inner"
                  style={{ backgroundImage: `url('${getServiceImage(proc.name || '')}')` }}
                />
              </div>
            </article>
          ))}

          {!loading && filteredProcedures.length === 0 && (
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
              Nenhum serviço encontrado.
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-[#f8f6f7] via-[#f8f6f7] to-transparent dark:from-[#221018] dark:via-[#221018] dark:to-transparent pb-6 pt-12 px-5 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <button
            onClick={() => {
              resetForm();
              setEditingId(-1);
              setInsertIndex(0);
              setShowFormModal(true);
            }}
            className="w-full flex cursor-pointer items-center justify-center rounded-xl h-14 px-6 bg-[#ee2b7c] hover:bg-[#d81f6f] active:scale-[0.98] text-white text-base font-bold tracking-wide shadow-lg shadow-[#ee2b7c]/30 transition-all gap-3"
          >
            <Plus size={20} />
            <span>Adicionar Novo Serviço</span>
          </button>
        </div>
      </div>

      {showFormModal && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center p-4 bg-black/40 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#f8f6f7] dark:bg-[#221018] rounded-2xl shadow-2xl border border-[#e7cfd9]/40 dark:border-white/10 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#e7cfd9]/40 dark:border-white/10 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#1b0d13] dark:text-white">
                {editingId && editingId !== -1 ? 'Editar Serviço' : 'Novo Serviço'}
              </h2>
              <button
                onClick={resetForm}
                className="text-[#9a4c6c] hover:text-[#1b0d13] dark:text-[#d48fa8] dark:hover:text-white transition-colors"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 max-h-[80vh] overflow-y-auto">
              {renderForm(true)}
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal 
        isOpen={deleteModal.isOpen}
        title="Excluir Serviço"
        message="Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita."
        onConfirm={() => deleteModal.id && handleDelete(deleteModal.id)}
        onCancel={() => setDeleteModal({ isOpen: false, id: null })}
        isDanger={true}
        confirmText="Excluir"
      />
    </div>
  );
}
