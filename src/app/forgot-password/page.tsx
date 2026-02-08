'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) return setError('Informe seu e-mail.');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!res.ok) throw new Error('Erro ao solicitar');
      setDone(true);
    } catch {
      setError('Erro ao solicitar redefinição.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-md mx-auto min-h-screen flex flex-col">
        <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-900 px-6 py-4 pt-6 flex items-center justify-center">
          <h1 className="text-xl font-bold">Esqueci a Senha</h1>
        </header>

        <main className="flex-1 px-6 py-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="size-20 rounded-full bg-fuchsia-500/20 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-fuchsia-400 text-3xl">mail</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Recuperar acesso</h2>
            <p className="text-slate-400 text-sm">Enviaremos um link para redefinir sua senha.</p>
          </div>

          {done ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center text-sm text-slate-300">
              Se o e-mail existir, você receberá um link para redefinição.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"
                />
              </div>

              {error && <p className="text-sm text-rose-400">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-base py-3.5 rounded-full shadow-lg shadow-fuchsia-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando...' : 'Enviar link'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-fuchsia-400 hover:text-fuchsia-300">
              Voltar para o login
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
