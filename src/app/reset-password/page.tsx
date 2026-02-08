'use client';

import { useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const checks = useMemo(() => {
    const hasLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const matches = password.length > 0 && password === confirm;
    return { hasLength, hasNumber, hasSpecial, matches };
  }, [password, confirm]);

  const canSubmit = checks.hasLength && checks.hasNumber && checks.hasSpecial && checks.matches && !!token;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao redefinir');
      setDone(true);
      setTimeout(() => router.push('/login'), 1500);
    } catch (err: any) {
      setError(err.message || 'Erro ao redefinir');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-md mx-auto min-h-screen flex flex-col">
        <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-900 px-6 py-4 pt-6 flex items-center justify-center">
          <h1 className="text-xl font-bold">Criar Nova Senha</h1>
        </header>

        <main className="flex-1 px-6 py-8">
          <div className="flex flex-col items-center text-center">
            <div className="size-20 rounded-full bg-fuchsia-500/20 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-fuchsia-400 text-3xl">lock</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Criar Nova Senha</h2>
            <p className="text-slate-400 text-sm mb-8">Escolha uma senha forte para proteger sua conta.</p>
          </div>

          {!token && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center text-sm text-slate-300">
              Token inválido ou ausente.
            </div>
          )}

          {done ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center text-sm text-emerald-300">
              Senha atualizada com sucesso!
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nova Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua nova senha"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    aria-label="Mostrar senha"
                  >
                    <span className="material-symbols-outlined">{showPassword ? 'visibility' : 'visibility_off'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Confirmar Nova Senha</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Confirme a nova senha"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    aria-label="Mostrar senha"
                  >
                    <span className="material-symbols-outlined">{showConfirm ? 'visibility' : 'visibility_off'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className={`flex items-center gap-2 ${checks.hasLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <span className="material-symbols-outlined text-base">{checks.hasLength ? 'check_circle' : 'radio_button_unchecked'}</span>
                  <span>Pelo menos 8 caracteres</span>
                </div>
                <div className={`flex items-center gap-2 ${checks.hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <span className="material-symbols-outlined text-base">{checks.hasNumber ? 'check_circle' : 'radio_button_unchecked'}</span>
                  <span>Pelo menos um número</span>
                </div>
                <div className={`flex items-center gap-2 ${checks.hasSpecial ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <span className="material-symbols-outlined text-base">{checks.hasSpecial ? 'check_circle' : 'radio_button_unchecked'}</span>
                  <span>Pelo menos um caractere especial</span>
                </div>
                <div className={`flex items-center gap-2 ${checks.matches ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <span className="material-symbols-outlined text-base">{checks.matches ? 'check_circle' : 'radio_button_unchecked'}</span>
                  <span>Senhas coincidem</span>
                </div>
              </div>

              {error && <p className="text-sm text-rose-400">{error}</p>}

              <button
                type="submit"
                disabled={!canSubmit || loading}
                className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-base py-3.5 rounded-full shadow-lg shadow-fuchsia-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Salvando...' : 'Salvar Nova Senha'}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
