'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FinancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Data
  const [summary, setSummary] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]); // Revenues
  const [expenses, setExpenses] = useState<any[]>([]); // Expenses

  // UI State
  const [activeTab, setActiveTab] = useState<'receitas' | 'despesas'>('receitas');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Helper for Local Date YYYY-MM-DD
  const getLocalDate = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  const [currentMonth, setCurrentMonth] = useState(getLocalDate().slice(0, 7)); // YYYY-MM

  // New Expense Form State
  const [newExpense, setNewExpense] = useState({
      description: '',
      amount: '',
      date: getLocalDate(),
      category: 'Outros',
      is_recurring: false,
      recurrence_day: ''
  });

  const fetchData = async () => {
    try {
        setLoading(true);
        // 1. Revenues (Leads History) - Filter by Month
        const resHistory = await fetch(`/api/finance/history?month=${currentMonth}`);
        const dataHistory = await resHistory.json();
        const txs = dataHistory.transactions || [];
        setHistory(txs);

        // 2. Expenses - Filter by Month
        const resExpenses = await fetch(`/api/finance/expenses?month=${currentMonth}`);
        const dataExpenses = await resExpenses.json();
        const exps = dataExpenses.expenses || [];
        setExpenses(exps);

        // 3. Calculate Summary Locally for fast feedback (or fetch from API if complex)
        // Revenue Realized
        const realized = txs
            .filter((t: any) => t.status === 'realizado')
            .reduce((acc: number, t: any) => acc + Number(t.price), 0);
        
        // Expenses Total
        const totalExpenses = exps.reduce((acc: number, e: any) => acc + Number(e.amount), 0);

        // Net Profit
        const netProfit = realized - totalExpenses;

        // Projected (Realized + Scheduled)
        // Agendado = Money to come. Realizado = Money already in.
        // Projected usually means Total Potential Revenue for the period.
        const projected = txs
            .filter((t: any) => t.status === 'realizado' || t.status === 'agendado')
            .reduce((acc: number, t: any) => acc + Number(t.price), 0);

        setSummary({
            realized,
            projected,
            expenses: totalExpenses,
            netProfit
        });

    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router, currentMonth]);

  const handleCreateExpense = async () => {
      if (!newExpense.description || !newExpense.amount || !newExpense.date) return alert('Preencha os campos obrigatórios');

      try {
          await fetch('/api/finance/expenses', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newExpense)
          });
          setIsExpenseModalOpen(false);
          setNewExpense({
            description: '',
            amount: '',
            date: getLocalDate(),
            category: 'Outros',
            is_recurring: false,
            recurrence_day: ''
          });
          fetchData(); // Refresh
      } catch (e) {
          alert('Erro ao criar despesa');
      }
  };

  const handleDeleteExpense = async (id: number) => {
      if (!confirm('Deseja excluir esta despesa?')) return;
      try {
          await fetch(`/api/finance/expenses/${id}`, { method: 'DELETE' });
          fetchData();
      } catch (e) {
          alert('Erro ao excluir');
      }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  if (loading && !summary) return <div className="flex h-screen items-center justify-center text-slate-500">Carregando financeiro...</div>;

  return (
    <div className="min-h-screen bg-slate-950 p-0 md:p-10 text-slate-200">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-10 bg-slate-900 p-4 md:p-6 rounded-none md:rounded-2xl shadow-lg border-b md:border border-slate-800 gap-4">
           <div>
               <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                   Fluxo de Caixa
                   <input 
                       type="month" 
                       value={currentMonth} 
                       onChange={(e) => { setCurrentMonth(e.target.value); }}
                       className="text-sm font-normal text-slate-400 bg-slate-800 border border-slate-700 rounded p-1 ml-2 cursor-pointer focus:ring-2 focus:ring-fuchsia-500 outline-none hover:text-white transition-colors"
                   />
               </h1>
               <p className="text-slate-500 text-sm">Controle de receitas e despesas</p>
           </div>
           <div className="flex gap-2 w-full md:w-auto">
               <button 
                onClick={() => setIsExpenseModalOpen(true)}
                className="flex-1 md:flex-none px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-sm shadow-red-900/50"
               >
                   - Nova Despesa
               </button>
               <button onClick={() => router.push('/admin/dashboard')} className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-lg font-medium border border-slate-700">
                   Voltar
               </button>
           </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 p-4 md:p-0">
            {/* Receitas */}
            <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800 hover:border-slate-700 transition-all">
                <span className="text-green-500 text-xs font-bold uppercase tracking-wider">Recebido</span>
                <div className="text-2xl md:text-3xl font-bold text-white mt-2">{formatCurrency(summary?.realized || 0)}</div>
                <p className="text-[10px] text-slate-500 mt-1">Status: Realizado</p>
            </div>

            {/* Projetado - NEW */}
            <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800 hover:border-slate-700 transition-all">
                <span className="text-blue-500 text-xs font-bold uppercase tracking-wider">Projetado</span>
                <div className="text-2xl md:text-3xl font-bold text-white mt-2">{formatCurrency(summary?.projected || 0)}</div>
                <p className="text-[10px] text-slate-500 mt-1">Recebido + Agendado</p>
            </div>
            
            {/* Despesas */}
            <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800 hover:border-slate-700 transition-all">
                <span className="text-red-500 text-xs font-bold uppercase tracking-wider">Despesas</span>
                <div className="text-2xl md:text-3xl font-bold text-white mt-2">{formatCurrency(summary?.expenses || 0)}</div>
                <p className="text-[10px] text-slate-500 mt-1">Total de saídas</p>
            </div>

            {/* Lucro Líquido */}
            <div className={`p-6 rounded-2xl shadow-lg text-white ${summary?.netProfit >= 0 ? 'bg-gradient-to-br from-slate-800 to-black border border-slate-700' : 'bg-red-900/80 border border-red-800'}`}>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Lucro Líquido</span>
                <div className="text-2xl md:text-3xl font-bold mt-2">{formatCurrency(summary?.netProfit || 0)}</div>
                <p className="text-[10px] text-slate-400 mt-1">{summary?.netProfit >= 0 ? 'Saldo Positivo 🚀' : 'Saldo Negativo ⚠️'}</p>
            </div>
        </div>

        {/* Tabs */}
        <div className="bg-slate-900 rounded-t-2xl border-b border-slate-800 px-6 pt-4 flex gap-6">
            <button 
                onClick={() => setActiveTab('receitas')}
                className={`pb-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'receitas' ? 'border-fuchsia-500 text-fuchsia-500' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
                Receitas (Entradas)
            </button>
            <button 
                onClick={() => setActiveTab('despesas')}
                className={`pb-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'despesas' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
                Despesas (Saídas)
            </button>
        </div>

        {/* Content */}
        <div className="bg-slate-900 rounded-b-2xl shadow-lg border border-slate-800 min-h-[400px]">
            
            {/* RECEITAS TAB */}
            {activeTab === 'receitas' && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-950 text-slate-500 text-xs uppercase border-b border-slate-800">
                            <tr>
                                <th className="p-4">Data</th>
                                <th className="p-4">Cliente / Descrição</th>
                                <th className="p-4">Valor</th>
                                <th className="p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {history.filter(t => t.status === 'realizado').map(t => (
                                <tr key={t.id} className="hover:bg-slate-800 transition-colors">
                                    <td className="p-4 text-slate-300 font-medium">{t.appointment_date.toString().split('T')[0].split('-').reverse().join('/')}</td>
                                    <td className="p-4">
                                        <p className="font-bold text-white">{t.client_name}</p>
                                        <p className="text-xs text-slate-500">{t.procedure_name}</p>
                                    </td>
                                    <td className="p-4 text-emerald-400 font-bold">+{formatCurrency(Number(t.price))}</td>
                                    <td className="p-4"><span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded font-bold uppercase border border-emerald-500/20">Recebido</span></td>
                                </tr>
                            ))}
                            {history.filter(t => t.status === 'realizado').length === 0 && (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-500">Nenhuma receita registrada.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* DESPESAS TAB */}
            {activeTab === 'despesas' && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-950 text-slate-500 text-xs uppercase border-b border-slate-800">
                            <tr>
                                <th className="p-4">Data</th>
                                <th className="p-4">Descrição</th>
                                <th className="p-4">Categoria</th>
                                <th className="p-4">Recorrência</th>
                                <th className="p-4">Valor</th>
                                <th className="p-4">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {expenses.map(exp => (
                                <tr key={exp.id} className="hover:bg-slate-800 transition-colors group">
                                    <td className="p-4 text-slate-300 font-medium">{exp.date.toString().split('T')[0].split('-').reverse().join('/')}</td>
                                    <td className="p-4 font-bold text-white">{exp.description}</td>
                                    <td className="p-4"><span className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs border border-slate-700">{exp.category}</span></td>
                                    <td className="p-4">
                                        {exp.is_recurring ? (
                                            <span className="flex items-center gap-1 text-xs text-blue-400 font-bold bg-blue-500/10 px-2 py-1 rounded w-fit border border-blue-500/20">
                                                🔄 Dia {exp.recurrence_day}
                                            </span>
                                        ) : <span className="text-slate-600">-</span>}
                                    </td>
                                    <td className="p-4 text-red-400 font-bold">-{formatCurrency(Number(exp.amount))}</td>
                                    <td className="p-4">
                                        <button onClick={() => handleDeleteExpense(exp.id)} className="text-slate-500 hover:text-red-400 transition-colors">🗑️</button>
                                    </td>
                                </tr>
                            ))}
                            {expenses.length === 0 && (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Nenhuma despesa registrada.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

        </div>
      </div>

      {/* New Expense Modal */}
      {isExpenseModalOpen && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-slate-800">
                  <h3 className="text-xl font-bold text-white mb-6">Nova Despesa</h3>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Descrição</label>
                          <input 
                              type="text" 
                              className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-lg outline-none focus:ring-2 focus:ring-red-500 placeholder-slate-500"
                              placeholder="Ex: Aluguel, Esmaltes..."
                              value={newExpense.description}
                              onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                          />
                      </div>

                      <div className="flex gap-4">
                          <div className="flex-1">
                              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Valor (R$)</label>
                              <input 
                                  type="number" 
                                  className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-lg outline-none focus:ring-2 focus:ring-red-500 placeholder-slate-500"
                                  placeholder="0.00"
                                  value={newExpense.amount}
                                  onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                              />
                          </div>
                          <div className="flex-1">
                              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Data</label>
                              <input 
                                  type="date" 
                                  className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                                  value={newExpense.date}
                                  onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                              />
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Categoria</label>
                          <select 
                            className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                            value={newExpense.category}
                            onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                          >
                              <option value="Outros">Outros</option>
                              <option value="Produtos">Produtos</option>
                              <option value="Aluguel">Aluguel</option>
                              <option value="Contas">Contas (Luz/Água)</option>
                              <option value="Pessoal">Retirada Pessoal</option>
                          </select>
                      </div>

                      <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-800">
                          <div className="flex items-center gap-3">
                              <input 
                                id="recurring"
                                type="checkbox" 
                                className="w-5 h-5 text-red-600 rounded focus:ring-red-500 bg-slate-700 border-slate-600"
                                checked={newExpense.is_recurring}
                                onChange={e => setNewExpense({...newExpense, is_recurring: e.target.checked})}
                              />
                              <label htmlFor="recurring" className="font-bold text-slate-300 select-none cursor-pointer">Despesa Recorrente?</label>
                          </div>
                          
                          {newExpense.is_recurring && (
                              <div className="mt-3 animate-in slide-in-from-top-2">
                                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Dia da cobrança mensal</label>
                                  <input 
                                      type="number" 
                                      min="1" max="31"
                                      className="w-20 p-2 bg-slate-900 border border-slate-700 text-white rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                                      placeholder="Ex: 5"
                                      value={newExpense.recurrence_day}
                                      onChange={e => setNewExpense({...newExpense, recurrence_day: e.target.value})}
                                  />
                                  <p className="text-xs text-slate-500 mt-1">Essa despesa será projetada automaticamente nos próximos meses.</p>
                              </div>
                          )}
                      </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-8">
                      <button 
                          onClick={() => setIsExpenseModalOpen(false)}
                          className="px-4 py-2 text-slate-400 font-bold hover:bg-slate-800 rounded-lg hover:text-white transition-colors"
                      >
                          Cancelar
                      </button>
                      <button 
                          onClick={handleCreateExpense}
                          className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-lg shadow-red-900/40 transition-all"
                      >
                          Salvar Despesa
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
