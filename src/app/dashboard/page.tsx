'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
       if (session?.user?.role === 'admin') {
           router.push('/admin/dashboard');
           return;
       }
       fetchAppointments();
    }
  }, [status, session, router]);

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/leads/list'); // API enforces user_id for clients
      const data = await res.json();
      if (data.leads) {
        setAppointments(data.leads);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (id: number) => {
      if(!confirm('Deseja cancelar este agendamento?')) return;
      try {
          // Verify if we can reuse the same endpoint or need a specific one.
          // Currently /api/leads/[id] PUT handles updates.
          // Or /api/leads/[id]/delete DELETE
          // Since client, maybe better to just mark as 'cancelado'.
          const res = await fetch(`/api/leads/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'cancelado' })
          });
          if(res.ok) fetchAppointments();
      } catch (e) {
          console.error(e);
      }
  };

  if (status === 'loading' || loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-fuchsia-600"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-fuchsia-100 rounded-full flex items-center justify-center text-fuchsia-600 font-bold text-lg">
                    {session?.user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                    <h1 className="font-bold text-gray-800 leading-tight">Olá, {session?.user?.name?.split(' ')[0]}!</h1>
                    <p className="text-xs text-gray-500">Bem-vindo de volta</p>
                </div>
             </div>
             
             {/* Logout / New Booking */}
             <div className="flex gap-2">
                 <Link href="/" className="bg-fuchsia-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-fuchsia-700 transition-colors">
                    + Novo
                 </Link>
             </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 mt-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Meus Agendamentos</h2>

        {appointments.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="text-5xl mb-4">📅</div>
                <p className="text-gray-500 mb-6">Você ainda não tem agendamentos.</p>
                <Link href="/" className="text-fuchsia-600 font-bold hover:underline">
                    Agendar agora
                </Link>
            </div>
        ) : (
            <div className="space-y-4">
                {appointments.map((appt) => {
                    const isFuture = new Date(appt.appointment_date + 'T' + appt.appointment_time) > new Date();
                    const statusColors: any = {
                        'agendado': 'bg-green-100 text-green-700 border-green-200',
                        'pendente': 'bg-yellow-100 text-yellow-700 border-yellow-200',
                        'cancelado': 'bg-red-50 text-red-500 border-red-100',
                        'realizado': 'bg-blue-50 text-blue-600 border-blue-100'
                    };
                    const statusLabel: any = {
                        'agendado': 'Confirmado',
                        'pendente': 'Aguardando',
                        'cancelado': 'Cancelado',
                        'realizado': 'Concluído'
                    };

                    return (
                        <div key={appt.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-gray-800 text-lg">{appt.procedure_name}</h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[appt.status] || 'bg-gray-100 text-gray-500'}`}>
                                        {statusLabel[appt.status] || appt.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                                    <div className="flex items-center gap-1">
                                        📅 {new Date(appt.appointment_date).toLocaleDateString('pt-BR')}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        ⏰ {appt.appointment_time.slice(0,5)}
                                    </div>
                                </div>
                                <p className="text-fuchsia-600 font-bold">R$ {parseFloat(appt.price).toFixed(2)}</p>
                            </div>

                            {/* Actions */}
                            {isFuture && appt.status !== 'cancelado' && appt.status !== 'realizado' && (
                                <div className="self-end md:self-center">
                                    <button 
                                        onClick={() => cancelAppointment(appt.id)}
                                        className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-red-100"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        )}
      </main>
    </div>
  );
}
