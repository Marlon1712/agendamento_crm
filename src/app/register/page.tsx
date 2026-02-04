'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar conta');
      }

      // Auto login after register
      const loginRes = await signIn('credentials', {
        redirect: false,
        email: form.email,
        password: form.password,
      });

      if (loginRes?.error) {
        router.push('/login');
      } else {
        router.push('/admin/dashboard'); // Or client dashboard
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Crie sua Conta ✨</h1>
            <p className="text-gray-500">Agende serviços e acompanhe seu histórico</p>
        </div>

         {/* Google Register */}
         <button
          onClick={() => signIn('google', { callbackUrl: '/admin/dashboard' })}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 px-4 rounded-xl transition-all shadow-sm mb-6"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="Google" />
          Cadastrar com Google
        </button>

        <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">ou preencha os dados</span>
            </div>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center border border-red-100">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input 
                    type="text" 
                    required
                    value={form.name}
                    onChange={(e) => setForm({...form, name: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-all"
                    placeholder="Seu Nome"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone (Whatsapp)</label>
                <input 
                    type="tel" 
                    required
                    value={form.phone}
                    onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, '');
                        if (v.length > 11) v = v.slice(0, 11);
                        if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
                        if (v.length > 10) v = `${v.slice(0,10)}-${v.slice(10)}`;
                        setForm({...form, phone: v});
                    }}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-all"
                    placeholder="(00) 00000-0000"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                    type="email" 
                    required
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-all"
                    placeholder="seu@email.com"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <input 
                    type="password" 
                    required
                    value={form.password}
                    onChange={(e) => setForm({...form, password: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-all"
                    placeholder="••••••••"
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-fuchsia-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {loading ? 'Criando conta...' : 'Cadastrar'}
            </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-600">
            Já tem uma conta?{' '}
            <Link href="/login" className="text-fuchsia-600 font-bold hover:underline">
                Faça Login
            </Link>
        </p>
      </div>
    </div>
  );
}
