'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function AnamneseViewContent() {
  const params = useSearchParams();
  const router = useRouter();
  const name = params.get('name') || 'Cliente';
  const contact = params.get('contact') || '';
  const userId = params.get('user_id');
  const cpfParam = params.get('cpf') || '';

  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState({ diabetes: false, circulation: false, pregnant: false });
  const [allergies, setAllergies] = useState<string[]>([]);
  const [otherAllergy, setOtherAllergy] = useState('');
  const [notes, setNotes] = useState('');
  const [cpf, setCpf] = useState('');
  const [cpfAuto, setCpfAuto] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState<string>('');
  const [signatureStrokes, setSignatureStrokes] = useState<{ points: { x: number; y: number }[] }[]>([]);
  const [signaturePaths, setSignaturePaths] = useState<string[]>([]);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const url = userId
          ? `/api/clients/notes?user_id=${encodeURIComponent(userId)}`
          : `/api/clients/notes?name=${encodeURIComponent(name)}&contact=${encodeURIComponent(contact)}${cpfParam ? `&cpf=${encodeURIComponent(cpfParam)}` : ''}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data?.notes) {
          try {
            const parsed = JSON.parse(data.notes);
            setHealth(parsed.health || health);
            setAllergies(parsed.allergies || []);
            setOtherAllergy(parsed.otherAllergy || '');
            setNotes(parsed.notes || '');
            if (parsed.cpf) {
              setCpf(parsed.cpf || '');
              setCpfAuto(false);
            } else if (data?.cpf || cpfParam) {
              setCpf(data?.cpf || cpfParam || '');
              setCpfAuto(true);
            }
            setSignatureStrokes(parsed.signatureStrokes || []);
            setSignaturePaths(parsed.signaturePaths || []);
          } catch {
            setNotes(data.notes || '');
            if (data?.cpf || cpfParam) {
              setCpf(data?.cpf || cpfParam || '');
              setCpfAuto(true);
            }
          }
        } else if (data?.cpf || cpfParam) {
          setCpf(data?.cpf || cpfParam || '');
          setCpfAuto(true);
        }
        setUpdatedAt(data?.updated_at || null);
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, [userId, name, contact, cpfParam]);

  useEffect(() => {
    if (signaturePreview) return;
    if (signaturePaths.length === 0 && signatureStrokes.length === 0) return;
    const off = document.createElement('canvas');
    off.width = 300;
    off.height = 120;
    const ctx = off.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#e5e7eb';
    if (signaturePaths.length > 0) {
      signaturePaths.forEach((d) => {
        try { ctx.stroke(new Path2D(d)); } catch {}
      });
    } else {
      const points = signatureStrokes.flatMap((s) => s.points);
      if (points.length > 0) {
        const minX = Math.min(...points.map((p) => p.x));
        const maxX = Math.max(...points.map((p) => p.x));
        const minY = Math.min(...points.map((p) => p.y));
        const maxY = Math.max(...points.map((p) => p.y));
        const pad = 8;
        const srcW = Math.max(1, maxX - minX);
        const srcH = Math.max(1, maxY - minY);
        const scale = Math.min((off.width - pad * 2) / srcW, (off.height - pad * 2) / srcH);
        const offsetX = (off.width - srcW * scale) / 2 - minX * scale;
        const offsetY = (off.height - srcH * scale) / 2 - minY * scale;
        signatureStrokes.forEach((stroke) => {
          if (stroke.points.length < 2) return;
          ctx.beginPath();
          ctx.moveTo(stroke.points[0].x * scale + offsetX, stroke.points[0].y * scale + offsetY);
          for (let i = 1; i < stroke.points.length; i++) {
            const p = stroke.points[i];
            ctx.lineTo(p.x * scale + offsetX, p.y * scale + offsetY);
          }
          ctx.stroke();
        });
      }
    }
    setSignaturePreview(off.toDataURL('image/webp', 0.6));
  }, [signaturePaths, signatureStrokes, signaturePreview]);

  useEffect(() => {
    if (!previewCanvasRef.current) return;
    if (!signaturePaths || signaturePaths.length === 0) return;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#e5e7eb';
    signaturePaths.forEach((d) => {
      try { ctx.stroke(new Path2D(d)); } catch {}
    });
  }, [signaturePaths]);

  const updatedLabel = useMemo(() => {
    const base = updatedAt ? new Date(updatedAt) : new Date();
    return base.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }, [updatedAt]);

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

  const editLink = () => {
    const qp = new URLSearchParams({ name, contact });
    if (userId) qp.set('user_id', userId);
    if (cpf) qp.set('cpf', cpf);
    return `/admin/users/anamnese?${qp.toString()}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-md mx-auto min-h-screen flex flex-col">
        <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-900 px-6 py-4 pt-6 flex items-center justify-between">
          <button onClick={() => router.back()} className="text-slate-300">←</button>
          <div className="text-xs uppercase tracking-widest text-slate-500">Ficha de Anamnese</div>
          <Link href={editLink()} className="text-fuchsia-400 text-xs font-semibold">Editar</Link>
        </header>

        <main className="flex-1 px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold">
              {name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div>
              <p className="font-bold">{name}</p>
              <p className="text-xs text-slate-400">Atualizada: {updatedLabel}</p>
            </div>
          </div>

          <section className="mt-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <label className="text-xs text-slate-400 block mb-2">CPF da cliente</label>
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold text-white">
                {cpf ? formatCpf(cpf) : 'Não informado'}
              </div>
              {cpfAuto && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                  CPF automático
                </span>
              )}
            </div>
            {cpf && !isValidCpf(cpf) && (
              <p className="mt-2 text-xs text-amber-300">CPF inválido.</p>
            )}
          </section>

          <section className="mt-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-semibold uppercase tracking-wider">
              <span className="material-symbols-outlined text-base">health_and_safety</span>
              Saúde Geral
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                <span>Possui Diabetes?</span>
                <span className="text-xs font-semibold">{health.diabetes ? 'Sim' : 'Não'}</span>
              </div>
              <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                <span>Problemas Circulatórios?</span>
                <span className="text-xs font-semibold">{health.circulation ? 'Sim' : 'Não'}</span>
              </div>
              <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                <span>Gestante ou Lactante?</span>
                <span className="text-xs font-semibold">{health.pregnant ? 'Sim' : 'Não'}</span>
              </div>
            </div>
          </section>

          <section className="mt-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-rose-400 text-sm font-semibold">
              Alergias
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {allergies.length === 0 && (
                <span className="text-xs text-slate-400">Nenhuma alergia registrada.</span>
              )}
              {allergies.map((a) => (
                <span key={a} className="px-3 py-2 rounded-full text-xs font-semibold border bg-slate-800 border-slate-700 text-slate-200">
                  {a}
                </span>
              ))}
            </div>
            {allergies.includes('Outro') && (
              <p className="mt-3 text-xs text-slate-400">Outro: {otherAllergy || 'Não informado'}</p>
            )}
          </section>

          <section className="mt-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-semibold uppercase tracking-wider">
              <span className="material-symbols-outlined text-base">note</span>
              Especificações Técnicas
            </div>
            <div className="mt-3 w-full min-h-[120px] rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200">
              {notes || 'Sem observações.'}
            </div>
          </section>

          <section className="mt-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-semibold uppercase tracking-wider">
              <span className="material-symbols-outlined text-base">draw</span>
              Assinatura Digital
            </div>
            <div className="mt-3 w-full rounded-xl border border-slate-800 bg-slate-950 h-28 flex items-center justify-center text-sm text-slate-500 overflow-hidden">
              {signaturePreview ? (
                <img src={signaturePreview} alt="Assinatura" className="h-full w-full object-contain" />
              ) : signaturePaths.length > 0 ? (
                <canvas ref={previewCanvasRef} width={300} height={120} className="h-full w-full" />
              ) : (
                'Sem assinatura'
              )}
            </div>
          </section>

          {!loading && (
            <Link
              href={editLink()}
              className="mt-6 w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-3.5 rounded-full shadow-lg shadow-fuchsia-600/30 text-center block"
            >
              Editar Ficha
            </Link>
          )}
        </main>
      </div>
    </div>
  );
}

export default function AnamneseViewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <AnamneseViewContent />
    </Suspense>
  );
}
