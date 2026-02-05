'use client';

// (Applying changes via multiple chunks if file is large, but file is small enough for one go or chunks)
// I will use replace_file_content for imports and then multi_replace for content.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
    Calendar, 
    CheckCircle, 
    TrendingDown, 
    TrendingUp,
    Trophy, 
    Clock, 
    Lightbulb,
    AlertCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    fetch('/api/dashboard/analytics')
      .then((res) => {
        if (res.status === 401) {
            router.push('/admin/login');
            throw new Error('Unauthorized');
        }
        return res.json();
      })
      .then((data) => {
        setMetrics(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-slate-500">Carregando insights...</div>;

  return (
    <div className="min-h-screen bg-slate-950 p-0 md:p-10 text-slate-200">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 md:mb-10">
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-center md:text-left p-4 md:p-0">
          <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col hover:border-slate-700 transition-all">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-slate-800 rounded-lg text-fuchsia-500">
                    <Calendar size={24} />
                </div>
                <span className="text-slate-500 text-sm font-medium uppercase tracking-wider">Total Agendado</span>
            </div>
            <span className="text-4xl font-bold text-white mt-2">{metrics?.month_stats?.total || 0}</span>
          </div>
          <div className="bg-gradient-to-br from-fuchsia-900 to-slate-900 p-6 rounded-2xl shadow-lg border border-fuchsia-900/50 flex flex-col text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-600/20 blur-3xl -mr-10 -mt-10 rounded-full group-hover:bg-fuchsia-600/30 transition-all"></div>
            <div className="flex items-center gap-3 mb-2 z-10">
                <div className="p-2 bg-fuchsia-800/50 rounded-lg text-fuchsia-200">
                    <CheckCircle size={24} />
                </div>
                <span className="text-fuchsia-200 text-sm font-medium uppercase tracking-wider">Realizados</span>
            </div>
            <span className="text-4xl font-bold mt-2 z-10">{metrics?.month_stats?.realized || 0}</span>
            <p className="text-xs opacity-60 mt-1 z-10">Clientes atendidos este mês</p>
          </div>
          <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col hover:border-slate-700 transition-all">
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${metrics?.cancellation_rate > 15 ? 'bg-red-900/20 text-red-400' : 'bg-emerald-900/20 text-emerald-400'}`}>
                    {metrics?.cancellation_rate > 15 ? <AlertCircle size={24} /> : <TrendingDown size={24} />}
                </div>
                <span className="text-slate-500 text-sm font-medium uppercase tracking-wider">Cancelamentos</span>
            </div>
            <span className={`text-4xl font-bold mt-2 ${metrics?.cancellation_rate > 15 ? 'text-red-400' : 'text-emerald-400'}`}>
                {metrics?.cancellation_rate}%
            </span>
            <p className="text-xs text-slate-500 mt-1">{metrics?.cancellation_rate > 15 ? 'Atenção: Taxa Alta' : 'Dentro do normal'}</p>
          </div>
        </div>

        {/* INSIGHTS SECTION */}
        <h2 className="text-xl font-bold text-white mb-6 px-4 md:px-0">Métricas de Desempenho</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 md:px-0 mb-10">
            
            {/* Top Services */}
            <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <Trophy className="text-fuchsia-500" size={20} /> Serviços Mais Vendidos
                </h3>
                <div className="space-y-4">
                    {metrics?.top_services?.map((svc: any, i: number) => (
                        <div key={i} className="flex items-center gap-4">
                            <span className="text-2xl font-bold text-slate-700 w-6">#{i+1}</span>
                            <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                    <span className="font-medium text-slate-300">{svc.name}</span>
                                    <span className="font-bold text-fuchsia-500">{svc.count} x</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-full" 
                                        style={{ width: `${(svc.count / metrics.top_services[0].count) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {!metrics?.top_services?.length && <p className="text-slate-600 italic">Sem dados suficientes.</p>}
                </div>
            </div>

            {/* Peak Hours */}
            <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <Clock className="text-fuchsia-500" size={20} /> Horários de Pico
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {metrics?.peak_hours?.map((h: any, i: number) => (
                        <div key={i} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 text-center overflow-hidden hover:bg-slate-800 transition-colors">
                            <span className="block text-xl md:text-2xl font-black text-fuchsia-400">{h.hour}:00</span>
                            <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider block truncate">
                                {h.count} {h.count === 1 ? 'visita' : 'visitas'}
                            </span>
                        </div>
                    ))}
                    {!metrics?.peak_hours?.length && <p className="text-slate-600 italic col-span-2 text-sm">Sem dados suficientes.</p>}
                </div>
                <div className="mt-4 p-3 bg-slate-800/50 rounded-lg text-xs text-slate-500 border border-slate-800 flex items-center gap-2">
                    <Lightbulb size={16} className="text-yellow-500" /> Horários mais disputados.
                </div>
            </div>

        </div>

      </div>
    </div>
  );
}
