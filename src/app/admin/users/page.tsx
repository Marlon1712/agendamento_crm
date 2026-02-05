'use client';

import { useState, useEffect } from 'react';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
        const res = await fetch('/api/users');
        const data = await res.json();
        if(Array.isArray(data)) setUsers(data);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const updateUser = async (id: number, role: string) => {
      // Optimistic update
      const old = [...users];
      setUsers(users.map(u => u.id === id ? {...u, role} : u));
      
      try {
        // We only support role update via this quick action for now
        // To update name/phone we would need a full edit modal, but let's stick to roles for now.
        const user = users.find(u => u.id === id);
        await fetch(`/api/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role, name: user.name, phone: user.phone })
        });
      } catch (e) {
          alert('Erro ao atualizar');
          setUsers(old);
      }
  };

  const deleteUser = async (id: number) => {
      if(!confirm('Tem certeza? Isso pode apagar histórico de agendamentos associados.')) return;
      try {
          await fetch(`/api/users/${id}`, { method: 'DELETE' });
          setUsers(users.filter(u => u.id !== id));
      } catch (e) {
          alert('Erro ao excluir');
      }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Gerenciar Usuários</h1>

      <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-950 border-b border-slate-800">
                    <tr>
                        <th className="p-4 font-semibold text-slate-400 text-sm">Nome</th>
                        <th className="p-4 font-semibold text-slate-400 text-sm">Email</th>
                        <th className="p-4 font-semibold text-slate-400 text-sm">Função</th>
                        <th className="p-4 font-semibold text-slate-400 text-sm">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {users.map(user => (
                        <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                            <td className="p-4 font-medium text-slate-200">{user.name}</td>
                            <td className="p-4 text-slate-400">{user.email}</td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${user.role === 'admin' ? 'bg-purple-900/40 text-purple-300 border border-purple-500/30' : 'bg-blue-900/40 text-blue-300 border border-blue-500/30'}`}>
                                    {user.role}
                                </span>
                            </td>
                            <td className="p-4">
                                <button 
                                    className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                                    onClick={() => {/* TODO: Implement Delete */}}
                                    title="Remover Usuário"
                                >
                                    🗑️
                                </button>
                            </td>
                        </tr>
                    ))}
                    {users.length === 0 && !loading && (
                        <tr>
                            <td colSpan={5} className="p-10 text-center text-gray-400 italic">Nenhum usuário encontrado.</td>
                        </tr>
                    )}
                </tbody>
            </table>
          </div>
      </div>
    </div>
  );
}
