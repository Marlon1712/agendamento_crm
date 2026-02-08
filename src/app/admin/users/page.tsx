'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

export default function AdminUsers() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/clients')
      .then((res) => res.json())
      .then((data) => setClients(Array.isArray(data) ? data : []))
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return clients.filter((c) => String(c.name || '').toLowerCase().includes(term));
  }, [clients, search]);

  const getStatus = (client: any) => {
    const hasNotes = Boolean(client?.notes && String(client.notes).trim() !== '');
    if (!hasNotes || !client?.notes_updated_at) {
      return { label: 'FICHA PENDENTE', className: 'text-rose-300' };
    }
    if (!client?.last_visit) {
      return { label: 'ATUALIZADA', className: 'text-emerald-300' };
    }
    const lastVisit = new Date(client.last_visit);
    const updated = new Date(client.notes_updated_at);
    if (!Number.isNaN(updated.getTime()) && updated >= lastVisit) {
      return { label: 'ATUALIZADA', className: 'text-emerald-300' };
    }
    return { label: 'PENDENTE', className: 'text-amber-300' };
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    const first = parts[0]?.[0] || 'C';
    const last = parts[1]?.[0] || '';
    return `${first}${last}`.toUpperCase();
  };

  const formatLastVisit = (value?: string) => {
    if (!value) return 'Sem visitas';
    const d = value.includes('T') ? value.split('T')[0] : value;
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  const fichaLink = (c: any) => {
    const params = new URLSearchParams({
      name: c.name || '',
      contact: c.contact || ''
    });
    if (c.user_id) params.set('user_id', String(c.user_id));
    return `/admin/users/anamnese?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-md mx-auto min-h-screen flex flex-col">
        <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-900 px-6 py-4 pt-6 flex items-center justify-center">
          <h1 className="text-xl font-bold text-white">Perfil</h1>
        </header>

        <div className="px-4 pt-4 grid grid-cols-2 gap-3">
          <Link href="/admin/schedule" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
            <div className="size-10 rounded-xl bg-fuchsia-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-fuchsia-400">calendar_month</span>
            </div>
            <p className="text-sm font-semibold">Horário de Funcionamento</p>
            <p className="text-xs text-slate-400">Configurar agenda</p>
          </Link>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
            <div className="size-10 rounded-xl bg-fuchsia-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-fuchsia-400">group</span>
            </div>
            <p className="text-sm font-semibold">Gestão de Clientes</p>
            <p className="text-xs text-slate-400">Base de dados</p>
          </div>
        </div>

        <div className="px-4 mt-6 flex items-center justify-between">
          <h2 className="text-sm font-bold">Gestão de Clientes</h2>
          <span className="text-xs text-slate-400">{clients.length} total</span>
        </div>

        <div className="px-4 mt-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente por nome ou CPF..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"
          />
        </div>

        <div className="px-4 mt-4 flex flex-col gap-3 pb-24">
          {loading && (
            <div className="text-sm text-slate-400">Carregando clientes...</div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-sm text-slate-400">Nenhum cliente encontrado.</div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold">
                    {getInitials(filtered[0].name)}
                  </div>
                  <div>
                    <p className="font-semibold">{filtered[0].name}</p>
                    <p className="text-xs text-slate-400">Última visita: {formatLastVisit(filtered[0].last_visit)}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold ${getStatus(filtered[0]).className}`}>
                  {getStatus(filtered[0]).label}
                </span>
              </div>
              <div className="mt-3 bg-slate-950 border border-slate-800 rounded-xl p-3">
                <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-semibold">
                  <span className="material-symbols-outlined text-base">assignment</span>
                  Resumo da Anamnese
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {(filtered[0].notes && String(filtered[0].notes).length > 0)
                    ? 'Clique para ver os detalhes completos da anamnese.'
                    : 'Sem ficha registrada para este cliente.'}
                </p>
                <Link
                  href={fichaLink(filtered[0])}
                  className="mt-3 w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold py-2.5 rounded-full text-center block"
                >
                  VER / EDITAR FICHA
                </Link>
              </div>
            </div>
          )}

          {filtered.slice(1).map((c, idx) => {
            const status = getStatus(c);
            return (
              <Link
                key={`${c.name}-${idx}`}
                href={fichaLink(c)}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold">
                    {getInitials(c.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{c.name}</p>
                    <p className="text-xs text-slate-400">Última visita: {formatLastVisit(c.last_visit)}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold ${status.className}`}>{status.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
