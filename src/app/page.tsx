import BookingWizard from './components/BookingWizard';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <main className="min-h-screen bg-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-600 to-pink-600 mr-8">
            BeautyStudio
          </div>
          <div className="flex gap-6 items-center">
            <a href="#services" className="hidden md:block text-gray-600 hover:text-fuchsia-600 font-medium transition-colors">Serviços</a>
            <a href="#book" className="hidden md:block text-gray-600 hover:text-fuchsia-600 font-medium transition-colors">Agendar</a>
            <Link 
                href="/login" 
                className="flex items-center justify-center p-2 rounded-full text-gray-500 hover:text-fuchsia-600 hover:bg-fuchsia-50 transition-all"
                title="Login"
                aria-label="Login"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-50 to-pink-50 -z-10" />
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-fuchsia-100/50 to-transparent blur-3xl -z-10" />
        
        <div className="max-w-6xl mx-auto px-4 text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-white border border-fuchsia-100 text-fuchsia-600 text-xs font-bold uppercase tracking-wider mb-6 shadow-sm animate-fade-in">
            ✨ Sua beleza, nossa paixão
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-snug animate-fade-in-up">
            Realce Sua <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-pink-600">Beleza Natural</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto animate-fade-in-up delay-100">
            Cuidado exclusivo e personalizado para você. Experimente o melhor em serviços de manicure, pedicure e relaxamento.
          </p>
          <div className="flex justify-center gap-4 animate-fade-in-up delay-200">
            <a href="#book" className="px-8 py-4 bg-gray-900 text-white rounded-full font-bold shadow-lg hover:bg-black hover:scale-105 transition-all">
              Agendar Agora
            </a>
            <a href="#services" className="px-8 py-4 bg-white text-gray-900 border border-gray-200 rounded-full font-bold hover:bg-gray-50 transition-all">
              Ver Serviços
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white" id="features">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-gray-50 hover:bg-fuchsia-50/50 transition-colors group text-center">
            <div className="w-16 h-16 mx-auto bg-white rounded-full shadow-sm flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
              💅
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Especialistas</h3>
            <p className="text-gray-500">Profissionais altamente qualificados e atualizados com as últimas tendências.</p>
          </div>
          <div className="p-8 rounded-2xl bg-gray-50 hover:bg-fuchsia-50/50 transition-colors group text-center">
            <div className="w-16 h-16 mx-auto bg-white rounded-full shadow-sm flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
              ✨
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Produtos Premium</h3>
            <p className="text-gray-500">Utilizamos apenas produtos de alta qualidade para garantir o melhor resultado.</p>
          </div>
          <div className="p-8 rounded-2xl bg-gray-50 hover:bg-fuchsia-50/50 transition-colors group text-center">
            <div className="w-16 h-16 mx-auto bg-white rounded-full shadow-sm flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
              🍃
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Ambiente Relaxante</h3>
            <p className="text-gray-500">Um espaço pensado para o seu conforto e bem-estar durante todo o atendimento.</p>
          </div>
        </div>
      </section>

      {/* Services Highlight (Static for landing impact) */}
      <section className="py-20 bg-gray-900 text-white overflow-hidden" id="services">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Nossos Serviços</h2>
            <p className="text-gray-400">Tudo para você se sentir incrível.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             {/* Decorative Cards */}
             <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:bg-white/20 transition-colors">
                <span className="text-4xl mb-4 block">💅</span>
                <h3 className="font-bold text-lg mb-1">Manicure</h3>
                <p className="text-sm text-gray-400">Cuticulagem perfeita e esmaltação impecável.</p>
             </div>
             <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:bg-white/20 transition-colors">
                <span className="text-4xl mb-4 block">🦶</span>
                <h3 className="font-bold text-lg mb-1">Pedicure</h3>
                <p className="text-sm text-gray-400">Cuidados especiais para a saúde dos seus pés.</p>
             </div>
             <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:bg-white/20 transition-colors">
                <span className="text-4xl mb-4 block">🧖‍♀️</span>
                <h3 className="font-bold text-lg mb-1">Spa dos Pés</h3>
                <p className="text-sm text-gray-400">Relaxamento profundo com esfoliação e hidratação.</p>
             </div>
             <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:bg-white/20 transition-colors">
                <span className="text-4xl mb-4 block">🖌️</span>
                <h3 className="font-bold text-lg mb-1">Nail Art</h3>
                <p className="text-sm text-gray-400">Designs exclusivos para expressar sua personalidade.</p>
             </div>
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section className="py-24 bg-gradient-to-b from-fuchsia-50 to-white relative" id="book">
        <div className="max-w-4xl mx-auto px-4">
           <div className="text-center mb-12">
               <span className="text-fuchsia-600 font-bold uppercase tracking-wider text-sm">Online & Rápido</span>
               <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">Agende seu Horário</h2>
               <p className="text-gray-600">Selecione o serviço abaixo e garanta sua vaga em menos de 1 minuto.</p>
           </div>
           
           <div className="bg-white rounded-3xl shadow-2xl shadow-fuchsia-100 overflow-hidden ring-1 ring-black/5 transform transition-all hover:scale-[1.01] duration-500">
               <div className="p-1 md:p-8">
                  <BookingWizard />
               </div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 text-center">
             <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-600 to-pink-600 mb-6 inline-block">
                BeautyStudio
            </div>
            <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8 mb-8 text-gray-600">
                <a href="https://instagram.com/freiresuene" target="_blank" className="flex items-center gap-3 text-fuchsia-600 hover:text-fuchsia-700 transition-all hover:scale-105 group">
                    <Image src="/icons/instagram.jpg" alt="Instagram" width={32} height={32} className="rounded-full shadow-sm" />
                    <span className="font-bold">@freiresuene</span>
                </a>
                <a href="https://wa.me/553492491811" target="_blank" className="flex items-center gap-3 text-fuchsia-600 hover:text-fuchsia-700 transition-all hover:scale-105 group">
                    <Image src="/icons/whatsapp.jpg" alt="WhatsApp" width={32} height={32} className="rounded-full shadow-sm" />
                    <span className="font-bold">(34) 9249-1811</span>
                </a>
            </div>
            <div className="mb-8 text-gray-500 max-w-md mx-auto">
                <p className="flex items-center justify-center gap-2 mb-1">📍 <strong className="text-gray-700">Studio de beleza Josy Machado</strong></p>
                <p>Rua Orestes Mendes Ferreira, 458 - Shopping Park</p>
                <p>Uberlandia-MG, 38425-575</p>
            </div>
            <p className="text-gray-400 text-sm">
                © {new Date().getFullYear()} BeautyStudio. Todos os direitos reservados.
            </p>
        </div>
      </footer>
    </main>
  );
}
