'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminClientsPage() {
  const router = useRouter();
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
    return clients.filter((c) => {
      const nameMatch = String(c.name || '').toLowerCase().includes(term);
      const cpfMatch = String(c.cpf || '').replace(/\D/g, '').includes(term.replace(/\D/g, ''));
      return nameMatch || (term.length >= 3 && cpfMatch);
    });
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
    if (!value) return { label: 'Última visita', text: 'Sem visitas' };
    const d = value.includes('T') ? value.split('T')[0] : value;
    const [y, m, day] = d.split('-');
    const dateText = `${day}/${m}/${y}`;
    const parsed = new Date(d);
    if (!Number.isNaN(parsed.getTime()) && parsed > new Date()) {
      return { label: 'Próxima visita', text: dateText };
    }
    return { label: 'Última visita', text: dateText };
  };

  const fichaLink = (c: any) => {
    const params = new URLSearchParams({
      name: c.name || '',
      contact: c.contact || ''
    });
    if (c.user_id) params.set('user_id', String(c.user_id));
    if (c.cpf) params.set('cpf', String(c.cpf));
    return `/admin/users/anamnese?${params.toString()}`;
  };

  const viewLink = (c: any) => {
    const params = new URLSearchParams({
      name: c.name || '',
      contact: c.contact || ''
    });
    if (c.user_id) params.set('user_id', String(c.user_id));
    if (c.cpf) params.set('cpf', String(c.cpf));
    return `/admin/users/anamnese/view?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-md mx-auto min-h-screen flex flex-col">
        <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-900 px-6 py-4 pt-6 flex items-center justify-between">
          <button onClick={() => router.back()} className="text-slate-300">←</button>
          <h1 className="text-lg font-bold text-white">Gestão de Clientes</h1>
          <div className="w-6" />
        </header>

        <div className="px-4 mt-4 flex items-center justify-between">
          <h2 className="text-sm font-bold">Clientes</h2>
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

          {!loading && filtered.length > 0 && filtered.map((c, idx) => {
            const status = getStatus(c);
            return (
              <div
                key={`${c.name}-${idx}`}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold">
                      {getInitials(c.name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{c.name}</p>
                        {c.cpf && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                            CPF
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        {formatLastVisit(c.last_visit).label}: {formatLastVisit(c.last_visit).text}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold ${status.className}`}>{status.label}</span>
                </div>
                <div className="mt-3 bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-semibold">
                    <span className="material-symbols-outlined text-base">assignment</span>
                    Resumo da Anamnese
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    {(c.notes && String(c.notes).length > 0)
                      ? 'Clique para ver os detalhes completos da anamnese.'
                      : 'Sem ficha registrada para este cliente.'}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Link
                      href={viewLink(c)}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2.5 rounded-full text-center block"
                    >
                      VISUALIZAR
                    </Link>
                    <Link
                      href={fichaLink(c)}
                      className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold py-2.5 rounded-full text-center block"
                    >
                      EDITAR
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
