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
  const strokesRef = useRef<{ points: { x: number; y: number }[] }[]>([]);
  const canvasReady = useRef(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [health, setHealth] = useState({ diabetes: false, circulation: false, pregnant: false });
  const [allergies, setAllergies] = useState<string[]>([]);
  const [otherAllergy, setOtherAllergy] = useState('');
  const [notes, setNotes] = useState('');
  const [cpf, setCpf] = useState('');
  const [signature, setSignature] = useState<string>('');
  const [pendingSignature, setPendingSignature] = useState<string>('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureError, setSignatureError] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [allowWithoutSignature, setAllowWithoutSignature] = useState(false);

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
            setOtherAllergy(parsed.otherAllergy || '');
            setNotes(parsed.notes || '');
            setCpf(parsed.cpf || '');
            setSignature(parsed.signature || '');
            setPendingSignature(parsed.signature || '');
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

  const drawStrokes = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#e5e7eb';

    strokesRef.current.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        const p = stroke.points[i];
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    });
  };

  useEffect(() => {
    if (!isSignatureOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const syncCanvasSize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#e5e7eb';
      ctx.clearRect(0, 0, rect.width, rect.height);
      strokesRef.current = [];
      const base = pendingSignature || signature;
      if (base) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
        };
        img.src = base;
      }
      canvasReady.current = true;
    };

    syncCanvasSize();
    const onResize = () => syncCanvasSize();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      canvasReady.current = false;
    };
  }, [isSignatureOpen, signature]);

  const startDraw = (x: number, y: number) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
    drawing.current = true;
    setIsDrawing(true);
    strokesRef.current.push({ points: [{ x, y }] });
  };

  const draw = (x: number, y: number) => {
    if (!drawing.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(x, y);
    ctx.stroke();
    const stroke = strokesRef.current[strokesRef.current.length - 1];
    if (stroke) stroke.points.push({ x, y });
  };

  const endDraw = () => {
    if (!canvasRef.current) return;
    drawing.current = false;
    setIsDrawing(false);
    const data = canvasRef.current.toDataURL('image/png');
    setPendingSignature(data);
  };

  const handlePointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.cancelable) e.preventDefault();
    if (e.type === 'pointerdown') {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (e.type === 'pointerdown') startDraw(x, y);
    if (e.type === 'pointermove') draw(x, y);
    if (e.type === 'pointerup' || e.type === 'pointerleave') {
      endDraw();
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const clearSignature = () => {
    setPendingSignature('');
    strokesRef.current = [];
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const undoSignature = () => {
    if (!strokesRef.current.length) return;
    strokesRef.current.pop();
    drawStrokes();
    if (canvasRef.current) {
      const data = canvasRef.current.toDataURL('image/png');
      setPendingSignature(data);
    }
  };

  const openSignature = () => {
    if (signatureError) setSignatureError('');
    setPendingSignature(signature);
    setIsSignatureOpen(true);
  };

  const closeSignature = () => {
    setIsSignatureOpen(false);
    setIsDrawing(false);
  };

  const toggleAllergy = (label: string) => {
    setAllergies((prev) =>
      prev.includes(label) ? prev.filter((a) => a !== label) : [...prev, label]
    );
  };

  const onlyDigits = (value: string) => value.replace(/\D/g, '');

  const formatCpf = (value: string) => {
    const digits = onlyDigits(value).slice(0, 11);
    const p1 = digits.slice(0, 3);
    const p2 = digits.slice(3, 6);
    const p3 = digits.slice(6, 9);
    const p4 = digits.slice(9, 11);
    if (digits.length <= 3) return p1;
    if (digits.length <= 6) return `${p1}.${p2}`;
    if (digits.length <= 9) return `${p1}.${p2}.${p3}`;
    return `${p1}.${p2}.${p3}-${p4}`;
  };

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

  const handleSave = async () => {
    if (allergies.includes('Outro') && !otherAllergy.trim()) {
      setSignatureError('Descreva a alergia em "Outro".');
      return;
    }
    if (!cpf.trim()) {
      setCpfError('CPF obrigatório.');
      return;
    }
    if (cpf && !isValidCpf(cpf)) {
      setCpfError('CPF inválido.');
      return;
    }
    if (!signature && !allowWithoutSignature) {
      setSignatureError('Assinatura obrigatória para salvar.');
      return;
    }
    setSaving(true);
    const payload = JSON.stringify({ health, allergies, otherAllergy, notes, cpf, signature });
    try {
      const res = await fetch('/api/clients/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId ? Number(userId) : null, name, contact, notes: payload })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSignatureError(data?.error || 'Erro ao salvar ficha.');
        return;
      }
      router.back();
    } finally {
      setSaving(false);
    }
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

          <section className="mt-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <label className="text-xs text-slate-400 block mb-2">CPF da cliente</label>
            <input
              value={cpf}
              onChange={(e) => {
                setCpf(formatCpf(e.target.value));
                if (cpfError) setCpfError('');
              }}
              placeholder="Digite o CPF"
              className={`w-full rounded-xl border bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 ${
                cpfError ? 'border-rose-500/60 ring-1 ring-rose-500/40' : 'border-slate-800'
              }`}
            />
            {cpfError && (
              <p className="mt-2 text-xs text-rose-300">{cpfError}</p>
            )}
          </section>

          <section className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-fuchsia-400 text-sm font-semibold">
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
            <div className="flex items-center gap-2 text-rose-400 text-sm font-semibold">
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
            {allergies.includes('Outro') && (
              <input
                value={otherAllergy}
                onChange={(e) => setOtherAllergy(e.target.value)}
                placeholder="Descreva a alergia"
                className="mt-3 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500"
              />
            )}
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
            <button
              type="button"
              onClick={openSignature}
              className="mt-3 w-full rounded-xl border border-slate-800 bg-slate-950 h-36 flex items-center justify-center text-sm text-slate-500 hover:text-slate-300 overflow-hidden"
            >
              {signature ? (
                <img src={signature} alt="Assinatura" className="h-full w-full object-contain" />
              ) : (
                'Toque para assinar'
              )}
            </button>
            <div className="mt-2 flex justify-end">
              <button onClick={clearSignature} className="text-xs text-slate-400">Limpar</button>
            </div>
            {signatureError && (
              <p className="mt-2 text-xs text-rose-300">{signatureError}</p>
            )}
            <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-3 py-2">
              <div className="text-xs text-slate-400">
                Salvar sem assinatura (admin)
              </div>
              <button
                type="button"
                onClick={() => {
                  setAllowWithoutSignature((prev) => !prev);
                  if (signatureError) setSignatureError('');
                }}
                className={`w-11 h-6 rounded-full border relative ${allowWithoutSignature ? 'bg-fuchsia-600 border-fuchsia-600' : 'bg-slate-800 border-slate-700'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${allowWithoutSignature ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
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

      {isSignatureOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
          <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
            <button onClick={closeSignature} className="text-slate-300">
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-sm font-semibold text-white">Assinatura</h3>
            <div className="flex items-center gap-3">
              <button onClick={undoSignature} className="text-xs text-slate-300 font-semibold">
                Desfazer
              </button>
              <button onClick={clearSignature} className="text-xs text-fuchsia-400 font-semibold">
                Limpar
              </button>
            </div>
          </div>
          <div className="flex-1 px-4 py-4 flex flex-col">
            <canvas
              ref={canvasRef}
              width={390}
              height={480}
              onPointerDown={handlePointer}
              onPointerMove={handlePointer}
              onPointerUp={handlePointer}
              onPointerLeave={handlePointer}
              className="w-full flex-1 rounded-2xl border border-slate-800 bg-slate-950 touch-none"
            />
            <p className="mt-3 text-xs text-slate-500 text-center">
              Toque e arraste para assinar
            </p>
          </div>
          <div className="px-4 pb-6">
            <button
              onClick={() => {
                if (pendingSignature) {
                  setSignature(pendingSignature);
                  setSignatureError('');
                }
                closeSignature();
              }}
              disabled={!pendingSignature}
              className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-3.5 rounded-full shadow-lg shadow-fuchsia-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Usar assinatura
            </button>
          </div>
        </div>
      )}
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
