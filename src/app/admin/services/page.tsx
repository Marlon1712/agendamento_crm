'use client';

import { useState, useEffect } from 'react';
import Calendar from '../../components/Calendar';
import CalendarRange from '../../components/CalendarRange';
import ConfirmationModal from '../../components/ConfirmationModal';
import { 
    Clock, 
    Pencil, 
    Trash2, 
    Sparkles, 
    MoveUp, 
    MoveDown, 
    Search,
    Plus,
    Tag,
    Gift,
    Layers,
    X,
    Check,
    Calculator,
    Percent,
    DollarSign
} from 'lucide-react';

export default function AdminServices() {
  const [procedures, setProcedures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
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

  // Promo Calculator State

  const [promoPercent, setPromoPercent] = useState<string>('');

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
    setPromoPercent('');
    setShowCalendar(false);
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

    // Calc percent for initial state if promo exists
    if (isPromo && proc.promo_price && proc.price) {
        const p = parseFloat(proc.price);
        const pp = parseFloat(proc.promo_price);
        if (p > 0) {
            const pct = ((p - pp) / p) * 100;
            setPromoPercent(pct.toFixed(0)); // Start in percent mode visually
        }
    } else {
        setPromoPercent('');
    }

    // Scroll removed
    setShowCalendar(false);
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
    <div className="bg-slate-800 p-4 w-full h-full flex flex-col gap-4 animate-in fade-in duration-200">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 h-full">
            {/* Header: Title */}
            <div className="flex justify-between items-center mb-1">
                <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                    {editingId === -1 ? <Sparkles size={16} className="text-fuchsia-400"/> : <Pencil size={16} className="text-fuchsia-400"/>}
                    {editingId === -1 ? 'Novo' : 'Editar'}
                </h3>
            </div>

            {/* 1. Name */}
            <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase">Nome</label>
                <input 
                    className="w-full bg-slate-900 border border-slate-700/50 rounded-lg p-2 text-white text-sm outline-none focus:border-fuchsia-500 transition-colors" 
                    value={form.name} 
                    onChange={e => setForm({...form, name: e.target.value})}
                    required
                    placeholder="Nome do Serviço"
                />
            </div>

            {/* 2. Description */}
            <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase">Descrição</label>
                <textarea 
                    className="w-full bg-slate-900 border border-slate-700/50 rounded-lg p-2 text-slate-300 text-sm outline-none focus:border-fuchsia-500 transition-colors resize-none h-16" 
                    value={form.description || ''} 
                    onChange={e => setForm({...form, description: e.target.value})}
                    placeholder="Detalhes para o cliente..."
                />
            </div>

            {/* 3. Note (Highlighted) */}
            <div>
                <label className="text-[10px] text-fuchsia-400 font-bold uppercase flex items-center gap-1"><Tag size={10}/> Destaque / Nota</label>
                <input 
                    className="w-full bg-fuchsia-900/20 border border-fuchsia-500/30 rounded-lg p-2 text-fuchsia-200 text-sm outline-none focus:border-fuchsia-500 transition-colors placeholder:text-fuchsia-700/50" 
                    value={form.observation || ''} 
                    onChange={e => setForm({...form, observation: e.target.value})}
                    placeholder="Ex: Mais Popular, Promoção..."
                />
            </div>

            {/* 4. Duration | Price */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                     <label className="text-[10px] text-slate-400 font-bold uppercase">Duração (min)</label>
                     <input type="number" step="5" className="w-full bg-slate-900 border border-slate-700/50 rounded-lg p-2 text-white text-sm outline-none focus:border-fuchsia-500 transition-colors" value={form.duration} onChange={e => setForm({...form, duration: parseInt(e.target.value)})} />
                </div>
                <div>
                     <label className="text-[10px] text-slate-400 font-bold uppercase">Preço (R$)</label>
                     <input type="number" step="0.01" className="w-full bg-slate-900 border border-slate-700/50 rounded-lg p-2 text-white text-sm outline-none focus:border-fuchsia-500 transition-colors" value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value)})} />
                </div>
            </div>

            {/* 5. Offer Switch & Type */}
            <div className="flex items-center gap-2 py-2 border-t border-slate-700/50 mt-1">
                <div className="flex items-center gap-2">
                    <button 
                        type="button"
                        onClick={() => {
                             const newVal = !form.isPromotional;
                             const today = new Date().toISOString().split('T')[0];
                             setForm({...form, isPromotional: newVal, promoEndDate: newVal && !form.promoEndDate ? today : form.promoEndDate});
                        }}
                        className={`w-8 h-4 rounded-full p-0.5 transition-colors relative flex-shrink-0 ${form.isPromotional ? 'bg-fuchsia-500' : 'bg-slate-700'}`}
                    >
                        <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${form.isPromotional ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                    <span className={`text-[10px] font-bold uppercase ${form.isPromotional ? 'text-fuchsia-400' : 'text-slate-500'}`}>Ativar Oferta ?</span>
                </div>

                {/* Offer Type Selector */}
                {form.isPromotional && (
                    <div className="flex-1 animate-in slide-in-from-left-2 fade-in overflow-hidden">
                        <div className="flex bg-slate-900 border border-slate-700 rounded-lg p-0.5 gap-0.5 w-full">
                            <button
                                type="button" 
                                onClick={() => setForm({...form, promoType: 'discount'})}
                                className={`flex-1 py-1 rounded-md text-[9px] font-bold uppercase flex items-center justify-center gap-1 transition-colors ${form.promoType === 'discount' ? 'bg-fuchsia-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                <Percent size={10} /> Desc.
                            </button>
                             <button
                                type="button" 
                                onClick={() => setForm({...form, promoType: 'gift'})}
                                className={`flex-1 py-1 rounded-md text-[9px] font-bold uppercase flex items-center justify-center gap-1 transition-colors ${form.promoType === 'gift' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                <Gift size={10} /> Brinde
                            </button>
                             <button
                                type="button" 
                                onClick={() => setForm({...form, promoType: 'combo'})}
                                className={`flex-1 py-1 rounded-md text-[9px] font-bold uppercase flex items-center justify-center gap-1 transition-colors ${form.promoType === 'combo' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                <Layers size={10} /> Combo
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 6. Promo Fields - One Line Layout */}
            {form.isPromotional && (
                <div className="flex flex-col gap-3 animate-in slide-in-from-top-2">
                     <div className="grid grid-cols-3 gap-2">
                          <div className="relative col-span-1">
                             <div className="flex justify-between items-center mb-1">
                                 <label className="text-[10px] text-fuchsia-400 font-bold uppercase truncate">Preço Promo</label>
                             </div>
                             
                             <div className="relative">
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    className="w-full bg-slate-900 border border-fuchsia-500/50 rounded p-2 text-fuchsia-400 font-bold outline-none focus:border-fuchsia-500 text-sm" 
                                    value={form.promoPrice} 
                                    onChange={e => {
                                        const val = e.target.value;
                                        setForm({...form, promoPrice: val});
                                        // Update percent state
                                        if (form.price > 0 && val) {
                                            const p = parseFloat(val);
                                            const pct = ((form.price - p) / form.price) * 100;
                                            setPromoPercent(pct.toFixed(0));
                                        }
                                    }} 
                                    placeholder="0.00"
                                />
                             </div>
                          </div>

                          <div className="relative col-span-1">
                             <div className="flex justify-between items-center mb-1">
                                 <label className="text-[10px] text-fuchsia-400 font-bold uppercase truncate">% Off</label>
                             </div>

                             <div className="relative">
                                <input 
                                    type="number" 
                                    className="w-full bg-slate-900 border border-fuchsia-500/50 rounded p-2 text-fuchsia-400 font-bold outline-none focus:border-fuchsia-500 text-sm pr-4" 
                                    value={promoPercent} 
                                    onChange={e => {
                                        const pct = e.target.value;
                                        setPromoPercent(pct);
                                        // Auto Calc Price
                                        if (form.price > 0 && pct) {
                                            const p = parseFloat(pct);
                                            const newVal = form.price - (form.price * (p / 100));
                                            setForm({...form, promoPrice: newVal.toFixed(2)});
                                        }
                                    }}
                                    placeholder="0"
                                />
                                <span className="absolute right-1 top-2 text-fuchsia-500 text-xs font-bold">%</span>
                            </div>
                          </div>

                          <div className="col-span-1">
                             <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block truncate">Vagas</label>
                             <input type="number" className="w-full bg-slate-900 border border-slate-700/50 rounded p-2 text-white text-sm outline-none focus:border-green-500" value={form.promoSlots} onChange={e => setForm({...form, promoSlots: e.target.value})} placeholder="Ilimitado" />
                          </div>
                     </div>
                                        <div className="mt-2">
                          <div className="flex justify-between items-center mb-1">
                                <label className="text-[10px] text-slate-500 font-bold uppercase block">Validade</label>
                                <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => {
                                      // Toggle Logic relying on Explicit State
                                      if (form.promoHasDeadline) {
                                          setForm({...form, promoHasDeadline: false, promoEndDate: ''});
                                      } else {
                                          const today = new Date().toISOString().split('T')[0];
                                          // Keep existing date if accidentally toggled, or set today using existing logic
                                          const nextEnd = form.promoEndDate || today;
                                          setForm({...form, promoHasDeadline: true, promoEndDate: nextEnd});
                                      }
                                }}>
                                    <div className={`w-3 h-3 rounded border flex items-center justify-center transition-colors ${!form.promoHasDeadline ? 'bg-fuchsia-600 border-fuchsia-600' : 'border-slate-600'}`}>
                                        {!form.promoHasDeadline && <Check size={8} className="text-white" />}
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase transition-colors ${!form.promoHasDeadline ? 'text-fuchsia-400' : 'text-slate-500'}`}>Sem Prazo</span>
                                </div>
                          </div>
                          
                          {/* Use Specific State for Condition */}
                          {!form.promoHasDeadline ? (
                              <div className="w-full bg-slate-900 border border-slate-700/50 rounded-lg p-3 flex flex-col gap-1 animate-in fade-in">
                                   <label className="text-[9px] text-fuchsia-500 font-bold uppercase">Início da Oferta</label>
                                   <input 
                                     type="date" 
                                     className="bg-transparent text-white text-sm outline-none font-bold w-full"
                                     value={form.promoStartDate}
                                     onChange={(e) => setForm({...form, promoStartDate: e.target.value})}
                                   />
                              </div>
                          ) : (
                             <CalendarRange 
                                startDate={form.promoStartDate}
                                endDate={form.promoEndDate}
                                onChange={(start, end) => setForm({...form, promoStartDate: start, promoEndDate: end})}
                                compact={true}
                             />
                          )}
                     </div>
                </div>
            )}

            {/* Bottom Buttons: Symmetrical */}
            <div className="mt-4 grid grid-cols-2 gap-4">
                 <button type="button" onClick={cancelEdit} className="flex items-center justify-center p-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">
                    <X size={20} />
                 </button>
                 <button type="submit" className="flex items-center justify-center p-3 rounded-xl bg-fuchsia-600 text-white hover:bg-fuchsia-500 shadow-lg shadow-fuchsia-900/30 transition-all active:scale-95">
                    <Check size={20} />
                 </button>
            </div>
        </form>
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Gerenciar Serviços</h1>

      {/* Form */}
        {/* Form Logic Handled Inline */}

      {/* List */}
      <h2 className="font-bold text-slate-500 text-sm uppercase mb-4 tracking-wider">Serviços Ativos (Ordem de Exibição)</h2>
      
      {/* Grid Layout - Increased Gap for Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-12 mt-10">

        {/* Empty State Action */}
        {procedures.length === 0 && !loading && (
             <div className="col-span-full mb-6">
                {editingId === -1 ? (
                    renderForm(true)
                ) : (
                    <button 
                        onClick={() => {
                            resetForm();
                            setEditingId(-1);
                            setInsertIndex(0);
                        }}
                        className="w-full py-12 border-2 border-dashed border-slate-700 hover:border-fuchsia-500 rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:text-fuchsia-500 transition-all gap-4 group"
                    >
                        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus size={32} />
                        </div>
                        <span className="font-bold uppercase tracking-widest">Criar Primeiro Serviço</span>
                    </button>
                )}
             </div>
        )}

        {procedures.map((proc: any, index: number) => {
            // Render Edit Form In-Place (Existing Item)
            if (editingId === proc.id) {
                return (
                    <div key={proc.id} className="relative rounded-2xl flex flex-col overflow-hidden border shadow-lg bg-slate-900 border-fuchsia-500/30 ring-1 ring-fuchsia-500/30">
                         {renderForm()}
                    </div>
                );
            }
            
            // Logic for In-Place New Item Form
            const isInsertingHere = editingId === -1 && insertIndex === index;
            

            const now = new Date();
            const nowTS = now.getTime();
            const startRaw = proc.promo_start_date ? new Date(proc.promo_start_date) : null;
            const endRaw = proc.promo_end_date ? new Date(proc.promo_end_date) : null;
            
            const startsInFuture = startRaw && startRaw.getTime() > nowTS;
            const isPromoPeriod = !!proc.is_promotional && 
                (!startRaw || startRaw.getTime() <= nowTS) &&
                (!endRaw || endRaw.getTime() >= nowTS);

            const promoType = proc.promo_type || 'discount';
            const isGift = promoType === 'gift';
            const isCombo = promoType === 'combo';

            const isFuture = !!startsInFuture && !!proc.is_promotional;
            const isActive = isPromoPeriod && !isFuture;
            
            // Calculate Percent for Display
            let discountPercent = 0;
            if (isActive && proc.price > 0 && proc.promo_price > 0) {
                discountPercent = Math.round(((proc.price - proc.promo_price) / proc.price) * 100);
            }

            const currentTouchOffset = (swipedId === proc.id) ? touchOffset : 0; 
            const isDeleting = currentTouchOffset < -50;

            return (
            <div id={`service-card-${proc.id}`} key={proc.id} className="relative group/item flex flex-col gap-6">
                
                {/* IN-PLACE FORM RENDER: If inserting at this index, show the form BEFORE this card */}
                {isInsertingHere && (
                    <div className="relative rounded-2xl flex flex-col overflow-hidden border shadow-lg bg-slate-900 border-fuchsia-500/30 ring-1 ring-fuchsia-500/30 animate-in slide-in-from-top-4 fade-in duration-300">
                         {renderForm(true)}
                    </div>
                )}

                <div className="relative">
                    {/* Insert Zone (Center) - Rectangular Button */}
                    {/* Only show if NOT editing any item (to prevent overlap) */}
                    {editingId === null && (
                        <div className="absolute -top-[34px] left-0 right-0 flex justify-center z-10">
                            <button 
                                onClick={() => {
                                    resetForm();
                                    setEditingId(-1);
                                    setInsertIndex(index);
                                }}
                                className="w-1/2 h-6 rounded-lg bg-slate-900 border border-dashed border-slate-600 text-slate-500 flex items-center justify-center opacity-60 hover:opacity-100 transition-all hover:scale-105 hover:border-fuchsia-500 hover:text-fuchsia-500 hover:shadow shadow-sm shadow-fuchsia-500/10"
                                title="Inserir Serviço Aqui"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    )}

                <div 
                    draggable={editingId === null}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onTouchStart={(e) => onTouchStart(e, proc.id)}
                    onTouchMove={onTouchMove}
                    onTouchEnd={() => onTouchEnd(proc.id)}
                    style={{ 
                        transform: (currentTouchOffset !== 0 && touchStart) ? `translateX(${currentTouchOffset}px)` : 'none',
                        opacity: isDeleting ? 0.5 : 1
                    }}
                    className={`
                        relative rounded-2xl flex flex-col overflow-hidden transition-all duration-200
                        border shadow-lg hover:shadow-2xl bg-slate-900 cursor-grab active:cursor-grabbing select-none
                        ${isActive ? 'border-fuchsia-500/30' : 'border-slate-800'}
                        ${draggedItem === index ? 'opacity-50 scale-95 border-dashed border-fuchsia-500' : ''}
                        ${isDeleting ? 'bg-red-900/10 border-red-500/50' : ''}
                    `}
                >
                    {/* Deleting Indicator */}
                    {isDeleting && (
                         <div className="absolute inset-y-0 right-0 w-20 flex items-center justify-center bg-red-600/20 text-red-500 z-50">
                             <Trash2 size={24} />
                         </div>
                    )}

                    {/* Badges */}
                    {isActive && (
                        <div className="absolute top-0 right-0 z-20 flex flex-col items-end">
                            <div className={`
                                ${proc.promo_type === 'gift' ? 'bg-gradient-to-l from-orange-600 to-orange-500' : 
                                  proc.promo_type === 'combo' ? 'bg-gradient-to-l from-blue-600 to-blue-500' : 
                                  'bg-gradient-to-l from-fuchsia-600 to-fuchsia-500'} 
                                text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-sm flex items-center gap-1
                            `}>
                                {proc.promo_type === 'gift' && <Gift size={10} />}
                                {proc.promo_type === 'combo' && <Layers size={10} />}
                                {(!proc.promo_type || proc.promo_type === 'discount') && <Tag size={10} />}
                                {proc.promo_type === 'gift' ? 'BRINDE' : proc.promo_type === 'combo' ? 'COMBO' : 'OFERTA'}
                            </div>
                            
                            {/* Discount Badge */}
                            {discountPercent > 0 && proc.promo_type !== 'gift' && (
                                <div className="bg-yellow-400 text-black text-[9px] font-black px-2 py-0.5 rounded-bl-lg shadow-sm mt-0.5">
                                    {discountPercent}% OFF
                                </div>
                            )}
                        </div>
                    )}
                    
                    <div className="p-5 flex flex-col h-full relative z-10">
                         <div className="flex justify-between items-start mb-2">
                            <h4 className={`font-bold text-lg leading-tight w-full pr-8 ${isActive ? 'text-white' : 'text-slate-200'}`}>
                                {proc.name}
                            </h4>
                         </div>

                         {/* Highlight Note */}
                         {proc.observation && (
                            <div className="mb-3">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-fuchsia-900/30 text-fuchsia-400 border border-fuchsia-500/20">
                                    <Sparkles size={10} /> {proc.observation}
                                </span>
                            </div>
                         )}

                         <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs px-2 py-1 rounded-md bg-slate-800 text-slate-400 font-medium flex items-center gap-1 border border-slate-700">
                                <Clock size={12} /> {proc.duration_minutes} min
                            </span>
                            {/* Slots Display */}
                            {isActive && proc.promo_slots > 0 && (
                                <span className="text-xs px-2 py-1 rounded-md bg-orange-900/20 text-orange-400 font-medium flex items-center gap-1 border border-orange-500/20">
                                    <Tag size={12} /> {proc.promo_slots} Vagas
                                </span>
                            )}
                         </div>

                        <p className="text-sm text-slate-500 leading-relaxed font-sans mb-4 line-clamp-2 min-h-[40px]">
                            {proc.description || "Sem descrição..."}
                        </p>

                        <div className="mt-auto border-t border-slate-800 pt-3 flex justify-between items-end">
                            <div className="flex flex-col">
                                {isActive ? (
                                    <>
                                        <span className="text-xs text-slate-500 line-through">R$ {parseFloat(proc.price).toFixed(2)}</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-bold text-orange-400">
                                                R$ {parseFloat(proc.promo_price).toFixed(2)}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <span className="text-2xl font-bold text-white">
                                        R$ {parseFloat(proc.price).toFixed(2)}
                                    </span>
                                )}
                            </div>

                            {/* Edit Button Only - Delete is in Edit Mode */}
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent drag/swipe interference if needed
                                    handleEdit(proc);
                                }}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:bg-fuchsia-600 hover:text-white transition-all shadow-sm"
                            >
                                <Pencil size={18} />
                            </button>
                        </div>
                    </div>
                </div>
                </div>
            </div>
            );
        })}
        
        {/* Append Logic: If inserting at the VERY END (after last item) */}
        {editingId === -1 && insertIndex === procedures.length && procedures.length > 0 && (
             <div className="col-span-full relative rounded-2xl flex flex-col overflow-hidden border shadow-lg bg-slate-900 border-fuchsia-500/30 ring-1 ring-fuchsia-500/30 animate-in slide-in-from-top-4 fade-in duration-300">
                {renderForm(true)}
             </div>
        )}

        {/* Append Button (if not empty and not inserting at end) */}
        {procedures.length > 0 && editingId === null && (
            <div className="col-span-1 min-h-[60px] flex items-center justify-center py-4">
                 <button 
                     onClick={() => {
                            resetForm();
                            setEditingId(-1);
                            setInsertIndex(procedures.length);
                     }}
                     className="w-1/2 h-8 rounded-lg bg-slate-900 border border-dashed border-slate-600 text-slate-500 flex items-center justify-center opacity-60 hover:opacity-100 transition-all hover:scale-105 hover:border-fuchsia-500 hover:text-fuchsia-500 hover:shadow shadow-sm shadow-fuchsia-500/10 gap-2"
                 >
                     <Plus size={14} />
                     <span className="text-[10px] font-bold uppercase tracking-wider">Adicionar ao Final</span>
                 </button>
            </div>
        )}
      </div>

      {/* Modal Confirmation */}
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
