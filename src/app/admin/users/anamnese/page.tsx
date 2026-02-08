'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function AnamneseContent() {
  const params = useSearchParams();
  const router = useRouter();
  const name = params.get('name') || 'Cliente';
  const contact = params.get('contact') || '';
  const userId = params.get('user_id');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [health, setHealth] = useState({ diabetes: false, circulation: false, pregnant: false });
  const [allergies, setAllergies] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [signature, setSignature] = useState<string>('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const url = userId
          ? `/api/clients/notes?user_id=${encodeURIComponent(userId)}`
          : `/api/clients/notes?name=${encodeURIComponent(name)}&contact=${encodeURIComponent(contact)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data?.notes) {
          try {
            const parsed = JSON.parse(data.notes);
            setHealth(parsed.health || health);
            setAllergies(parsed.allergies || []);
            setNotes(parsed.notes || '');
            setSignature(parsed.signature || '');
          } catch {
            setNotes(data.notes || '');
          }
        }
        setUpdatedAt(data?.updated_at || null);
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, name, contact]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#e5e7eb';

    if (signature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = signature;
    }
  }, [signature]);

  const startDraw = (x: number, y: number) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
    drawing.current = true;
  };

  const draw = (x: number, y: number) => {
    if (!drawing.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (!canvasRef.current) return;
    drawing.current = false;
    const data = canvasRef.current.toDataURL('image/png');
    setSignature(data);
  };

  const handlePointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (e.type === 'pointerdown') startDraw(x, y);
    if (e.type === 'pointermove') draw(x, y);
    if (e.type === 'pointerup' || e.type === 'pointerleave') endDraw();
  };

  const clearSignature = () => {
    setSignature('');
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const toggleAllergy = (label: string) => {
    setAllergies((prev) =>
      prev.includes(label) ? prev.filter((a) => a !== label) : [...prev, label]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = JSON.stringify({ health, allergies, notes, signature });
    await fetch('/api/clients/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId ? Number(userId) : null, name, contact, notes: payload })
    });
    setSaving(false);
    router.back();
  };

  const updatedLabel = useMemo(() => {
    const base = updatedAt ? new Date(updatedAt) : new Date();
    return base.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }, [updatedAt]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-md mx-auto min-h-screen flex flex-col">
        <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-900 px-6 py-4 pt-6 flex items-center justify-between">
          <button onClick={() => router.back()} className="text-slate-300">←</button>
          <div className="text-xs uppercase tracking-widest text-slate-500">Uso interno</div>
          <button className="text-fuchsia-400 text-xs font-semibold">Editar</button>
        </header>

        <main className="flex-1 px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold">
              {name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div>
              <p className="font-bold">{name}</p>
              <p className="text-xs text-slate-400">Última atualização: {updatedLabel}</p>
            </div>
          </div>

          <section className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-semibold uppercase tracking-wider">
              <span className="material-symbols-outlined text-base">local_hospital</span>
              Saúde Geral
            </div>
            <div className="mt-4 space-y-3">
              {[
                { key: 'diabetes', label: 'Possui Diabetes?' },
                { key: 'circulation', label: 'Problemas Circulatórios?' },
                { key: 'pregnant', label: 'Gestante ou Lactante?' }
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between text-sm">
                  <span>{item.label}</span>
                  <button
                    onClick={() => setHealth({ ...health, [item.key]: !health[item.key as keyof typeof health] })}
                    className={`w-10 h-6 rounded-full border relative ${health[item.key as keyof typeof health] ? 'bg-fuchsia-600 border-fuchsia-600' : 'bg-slate-800 border-slate-700'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${health[item.key as keyof typeof health] ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold uppercase tracking-wider">
              <span className="material-symbols-outlined text-base">warning</span>
              Alergias
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {['Látex', 'Esmalte Comum', 'Produtos Químicos', 'Acrílico', 'Níquel', 'Outro'].map((a) => (
                <button
                  key={a}
                  onClick={() => toggleAllergy(a)}
                  className={`px-3 py-2 rounded-full text-xs font-semibold border ${allergies.includes(a) ? 'bg-fuchsia-600 border-fuchsia-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
                >
                  {a}
                </button>
              ))}
            </div>
          </section>

          <section className="mt-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-semibold uppercase tracking-wider">
              <span className="material-symbols-outlined text-base">note</span>
              Especificações Técnicas
            </div>
            <textarea
              className="mt-3 w-full min-h-[120px] rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500"
              placeholder="Descreva condições das unhas, pele ou medicamentos em uso..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </section>

          <section className="mt-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-semibold uppercase tracking-wider">
              <span className="material-symbols-outlined text-base">draw</span>
              Assinatura Digital
            </div>
            <canvas
              ref={canvasRef}
              width={320}
              height={140}
              onPointerDown={handlePointer}
              onPointerMove={handlePointer}
              onPointerUp={handlePointer}
              onPointerLeave={handlePointer}
              className="mt-3 w-full rounded-xl border border-slate-800 bg-slate-950"
            />
            <div className="mt-2 flex justify-end">
              <button onClick={clearSignature} className="text-xs text-slate-400">Limpar</button>
            </div>
          </section>

          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="mt-6 w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-3.5 rounded-full shadow-lg shadow-fuchsia-600/30 disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Salvar Ficha'}
          </button>
        </main>
      </div>
    </div>
  );
}

export default function AnamnesePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <AnamneseContent />
    </Suspense>
  );
}
