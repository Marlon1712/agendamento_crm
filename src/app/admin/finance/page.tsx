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
  const [amountInput, setAmountInput] = useState('');

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
      if (!newExpense.amount || !newExpense.date) return alert('Preencha os campos obrigatórios');

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
          setAmountInput('');
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

  const formatAmountDisplay = (raw: string) => {
    if (!raw) return 'R$ 0,00';
    const cents = raw.replace(/\D/g, '');
    const value = Number(cents) / 100;
    return formatCurrency(value);
  };

  const handleAmountKey = (key: string) => {
    if (key === 'del') {
      setAmountInput((prev) => prev.slice(0, -1));
      return;
    }
    if (key === 'clear') {
      setAmountInput('');
      return;
    }
    if (!/^\d$/.test(key)) return;
    setAmountInput((prev) => `${prev}${key}`.replace(/^0+/, ''));
  };

  useEffect(() => {
    const cents = amountInput.replace(/\D/g, '');
    const value = cents ? (Number(cents) / 100).toFixed(2) : '';
    setNewExpense((prev) => ({ ...prev, amount: value }));
  }, [amountInput]);

  const getLast7Days = () => {
    const days: { key: string; label: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
      days.push({ key, label, total: 0 });
    }
    return days;
  };

  const dailySeries = (() => {
    const base = getLast7Days();
    const map = new Map(base.map((d) => [d.key, d]));
    history.forEach((t: any) => {
      if (t.status !== 'realizado') return;
      const key = String(t.appointment_date).split('T')[0];
      const item = map.get(key);
      if (item) item.total += Number(t.price || 0);
    });
    expenses.forEach((e: any) => {
      const key = String(e.date).split('T')[0];
      const item = map.get(key);
      if (item) item.total -= Number(e.amount || 0);
    });
    return base;
  })();
  const maxAbs = Math.max(1, ...dailySeries.map((d) => Math.abs(d.total)));

  if (loading && !summary) return <div className="flex h-screen items-center justify-center text-slate-500">Carregando financeiro...</div>;

  return (
    <div className="min-h-screen bg-[#f8f6f7] dark:bg-[#221018] text-[#1b0d13] dark:text-white">
      <div className="max-w-md mx-auto min-h-screen flex flex-col">
        <header className="sticky top-0 z-30 bg-[#f8f6f7]/95 dark:bg-[#221018]/95 backdrop-blur-md border-b border-[#e7cfd9]/40 dark:border-white/5 px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.push('/admin/dashboard')} className="text-[#1b0d13] dark:text-white">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-base font-bold">Financeiro</h1>
          <input
            type="month"
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
            className="text-xs font-semibold text-[#ee2b7c] bg-transparent border-none outline-none"
          />
        </header>

        <div className="px-4 pt-4">
          <div className="grid grid-cols-3 gap-2 bg-white dark:bg-[#2d1b24] border border-[#e7cfd9] dark:border-[#5e3a4b] rounded-full p-1">
            {['Dia', 'Semana', 'Mês'].map((t) => (
              <button
                key={t}
                className={`text-xs font-semibold py-2 rounded-full ${t === 'Mês' ? 'bg-[#ee2b7c] text-white' : 'text-[#9a4c6c] dark:text-[#d48fa8]'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 mt-4 grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-[#2d1b24] border border-[#e7cfd9] dark:border-[#5e3a4b] rounded-2xl p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Saldo Total</p>
            <p className="text-lg font-bold mt-2">{formatCurrency(summary?.netProfit || 0)}</p>
            <p className="text-[10px] text-green-600 mt-1">vs. mês anterior</p>
          </div>
          <div className="bg-white dark:bg-[#2d1b24] border border-[#e7cfd9] dark:border-[#5e3a4b] rounded-2xl p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Lucro</p>
            <p className="text-lg font-bold mt-2">{formatCurrency(summary?.realized || 0)}</p>
            <p className="text-[10px] text-green-600 mt-1">+5%</p>
          </div>
          <div className="col-span-2 bg-white dark:bg-[#2d1b24] border border-[#e7cfd9] dark:border-[#5e3a4b] rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">Projetado</p>
              <span className="text-[10px] text-[#ee2b7c] font-semibold">Recebido + Agendado</span>
            </div>
            <p className="text-xl font-bold mt-2">{formatCurrency(summary?.projected || 0)}</p>
          </div>
          <div className="col-span-2 bg-white dark:bg-[#2d1b24] border border-[#e7cfd9] dark:border-[#5e3a4b] rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">Entradas vs Saídas</p>
              <span className="text-[10px] text-green-600 font-semibold">+8%</span>
            </div>
            <p className="text-xl font-bold mt-2">{formatCurrency((summary?.realized || 0) + (summary?.expenses || 0))}</p>
            <div className="mt-3 h-20 rounded-lg border border-[#e7cfd9]/60 dark:border-[#5e3a4b] bg-[#fdf8fb] dark:bg-[#28141f] flex items-end justify-between px-2 pb-2 gap-2">
              {dailySeries.map((d) => {
                const height = Math.max(8, Math.round((Math.abs(d.total) / maxAbs) * 56));
                const isPositive = d.total >= 0;
                return (
                  <div key={d.key} className="flex flex-col items-center gap-1 flex-1">
                    <div
                      className={`w-full rounded-md ${isPositive ? 'bg-emerald-400/80' : 'bg-rose-400/80'}`}
                      style={{ height }}
                      title={`${d.label}: ${formatCurrency(d.total)}`}
                    />
                    <span className="text-[10px] text-gray-400">{d.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-4 mt-6 flex items-center justify-between">
          <h2 className="text-sm font-bold">Transações Recentes</h2>
          <button
            onClick={() => setActiveTab(activeTab === 'receitas' ? 'despesas' : 'receitas')}
            className="text-xs font-semibold text-[#ee2b7c]"
          >
            Ver tudo
          </button>
        </div>

        <div className="px-4 pb-28 mt-3 flex flex-col gap-3">
          {[
            ...history.map((t) => ({
              id: `r-${t.id}`,
              type: 'entrada',
              title: t.procedure_name,
              subtitle: t.client_name,
              amount: Number(t.price),
              date: t.appointment_date,
              badge: t.status === 'realizado' ? 'PIX' : 'CREDITO'
            })),
            ...expenses.map((e) => ({
              id: `e-${e.id}`,
              type: 'saida',
              title: e.description,
              subtitle: e.category,
              amount: Number(e.amount),
              date: e.date,
              badge: 'BOLETO'
            }))
          ]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 6)
            .map((item) => (
              <div key={item.id} className="bg-white dark:bg-[#2d1b24] border border-[#e7cfd9] dark:border-[#5e3a4b] rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">{item.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.subtitle}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${item.type === 'entrada' ? 'text-green-600' : 'text-red-500'}`}>
                    {item.type === 'entrada' ? '+' : '-'} {formatCurrency(item.amount)}
                  </p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ee2b7c]/10 text-[#ee2b7c] font-semibold">
                    {item.badge}
                  </span>
                </div>
              </div>
            ))}
        </div>

        <button
          onClick={() => setIsExpenseModalOpen(true)}
          className="fixed right-5 bottom-20 size-12 rounded-full bg-[#ee2b7c] text-white shadow-lg flex items-center justify-center"
        >
          +
        </button>
      </div>

      {/* New Expense Modal */}
      {isExpenseModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center backdrop-blur-sm">
              <div className="w-full max-w-md bg-[#f8f6f7] dark:bg-[#221018] rounded-t-3xl shadow-2xl border border-[#e7cfd9]/40 dark:border-white/5 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3">
                      <button onClick={() => setIsExpenseModalOpen(false)} className="text-[#1b0d13] dark:text-white">
                          <span className="material-symbols-outlined">close</span>
                      </button>
                      <h3 className="text-base font-bold text-[#1b0d13] dark:text-white">Nova Despesa</h3>
                      <button
                          onClick={() => {
                              setAmountInput('');
                              setNewExpense({
                                description: '',
                                amount: '',
                                date: getLocalDate(),
                                category: 'Outros',
                                is_recurring: false,
                                recurrence_day: ''
                              });
                          }}
                          className="text-xs font-semibold text-[#ee2b7c]"
                      >
                          Limpar
                      </button>
                  </div>

                  <div className="px-6 pt-2 pb-4">
                      <p className="text-xs text-gray-500 text-center">Valor da despesa</p>
                      <p className="text-3xl font-bold text-center text-[#1b0d13] dark:text-white">
                          {formatAmountDisplay(amountInput)}
                      </p>
                  </div>

                  <div className="px-6 pb-4">
                      <p className="text-xs font-semibold text-gray-500 mb-2">Categoria</p>
                      <div className="flex flex-wrap gap-2">
                          {['Produtos', 'Aluguel', 'Materiais', 'Contas', 'Pessoal', 'Outros'].map((cat) => (
                              <button
                                  key={cat}
                                  onClick={() => setNewExpense({ ...newExpense, category: cat })}
                                  className={`px-3 py-2 rounded-full text-xs font-semibold border ${
                                      newExpense.category === cat
                                          ? 'bg-[#ee2b7c] border-[#ee2b7c] text-white'
                                          : 'bg-white dark:bg-[#2d1b24] border-[#e7cfd9] dark:border-[#5e3a4b] text-[#1b0d13] dark:text-white'
                                  }`}
                              >
                                  {cat}
                              </button>
                          ))}
                      </div>
                  </div>

                  <div className="px-6 pb-4 grid grid-cols-2 gap-3">
                      <div>
                          <label className="text-xs font-semibold text-gray-500 mb-2 block">Data</label>
                          <input
                              type="date"
                              className="w-full rounded-xl border border-[#e7cfd9] dark:border-[#5e3a4b] bg-white dark:bg-[#2d1b24] px-3 py-2 text-sm"
                              value={newExpense.date}
                              onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                          />
                      </div>
                      <div>
                          <label className="text-xs font-semibold text-gray-500 mb-2 block">Nota</label>
                          <input
                              type="text"
                              className="w-full rounded-xl border border-[#e7cfd9] dark:border-[#5e3a4b] bg-white dark:bg-[#2d1b24] px-3 py-2 text-sm"
                              placeholder="Opcional"
                              value={newExpense.description}
                              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                          />
                      </div>
                  </div>

                  <div className="px-6 pb-4">
                      <div className="grid grid-cols-3 gap-3 text-center text-lg font-semibold text-[#1b0d13] dark:text-white">
                          {[1,2,3,4,5,6,7,8,9].map((n) => (
                              <button key={n} onClick={() => handleAmountKey(String(n))} className="py-3 rounded-xl bg-white dark:bg-[#2d1b24] border border-[#e7cfd9] dark:border-[#5e3a4b]">
                                  {n}
                              </button>
                          ))}
                          <button onClick={() => handleAmountKey('clear')} className="py-3 rounded-xl bg-white dark:bg-[#2d1b24] border border-[#e7cfd9] dark:border-[#5e3a4b]">
                              ,
                          </button>
                          <button onClick={() => handleAmountKey('0')} className="py-3 rounded-xl bg-white dark:bg-[#2d1b24] border border-[#e7cfd9] dark:border-[#5e3a4b]">
                              0
                          </button>
                          <button onClick={() => handleAmountKey('del')} className="py-3 rounded-xl bg-white dark:bg-[#2d1b24] border border-[#e7cfd9] dark:border-[#5e3a4b]">
                              ⌫
                          </button>
                      </div>
                  </div>

                  <div className="px-6 pb-6">
                      <button
                          onClick={handleCreateExpense}
                          className="w-full bg-[#8b2be2] hover:bg-[#7a22c9] text-white font-bold py-3.5 rounded-xl shadow-lg"
                      >
                          Salvar Despesa ✓
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
