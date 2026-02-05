'use client';

import Link from 'next/link';
import BookingWizard from './components/BookingWizard';
import { useState } from 'react';

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="bg-[#f8f6f6] dark:bg-[#211116] text-[#111418] dark:text-white min-h-screen font-sans overflow-x-hidden selection:bg-[#e64c7f] selection:text-white">
      {/* Styles for Icons */}
      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      <div className="relative flex h-auto min-h-screen w-full flex-col">
        {/* Header */}
        <header className="flex flex-col gap-2 bg-[#f8f6f6] dark:bg-[#211116] p-4 pb-2 sticky top-0 z-50 border-b border-[#e64c7f]/10 backdrop-blur-md bg-opacity-90 dark:bg-opacity-90">
          <div className="flex items-center h-12 justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e64c7f]/20 text-[#e64c7f]">
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>spa</span>
              </div>
              <p className="text-[#111418] dark:text-white tracking-tight text-xl font-bold leading-tight">Salon Éclat</p>
            </div>
            <div className="flex items-center justify-end">
              {/* Mobile Menu Button - simplified logic */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-[#111418] dark:text-white flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-[#e64c7f]/10 transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>menu</span>
              </button>
            </div>
          </div>
          {/* Simple Mobile Menu Dropdown */}
          {isMenuOpen && (
            <div className="absolute top-16 right-4 bg-white dark:bg-[#2a171d] shadow-xl rounded-xl p-4 flex flex-col gap-2 min-w-[200px] border border-[#e64c7f]/10 animate-fade-in">
              <Link href="/login" className="px-4 py-2 hover:bg-[#e64c7f]/10 rounded-lg text-sm font-bold">Login</Link>
              <Link href="/agendar" className="px-4 py-2 hover:bg-[#e64c7f]/10 rounded-lg text-sm font-bold">Agendar</Link>
            </div>
          )}
        </header>

        {/* Hero Section */}
        <section className="@container">
          <div className="@[480px]:p-4">
            <div
              className="relative flex min-h-[520px] flex-col gap-6 bg-cover bg-center bg-no-repeat @[480px]:gap-8 @[480px]:rounded-xl items-center justify-end p-6 pb-12 overflow-hidden shadow-2xl"
              style={{
                backgroundImage: 'linear-gradient(to bottom, rgba(33, 17, 22, 0) 0%, rgba(33, 17, 22, 0.4) 50%, rgba(33, 17, 22, 0.95) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuApBTgZhufn25iFVFbV5VB7VPFGIb48l6OWRNUvzf4gZqV_N21RzhAraARXYU9Epd_pSdlrAs8N0x-M5v8sjZtO2l7M0denOTwg6n07ZnU4c10k6BQPi5nmIRqCzvhjLF3dFFQQFx6gH2MjwvO9SAdDBVQfmtp8E0jm5kH3MWYl0zOT56OyaYFZVq4Gr-D0rXj0OUKdID1-MgX3keypodq_lPpisVlxaVqqeTCm20olja0LtdT9626-wgVsnyfeZ6CWiX-mV5VI0JY")'
              }}
            >
              <div className="flex flex-col gap-3 text-center z-10 max-w-lg">
                <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em] @[480px]:text-5xl drop-shadow-lg">
                  A beleza que você merece, com o cuidado que você sente
                </h1>
                <h2 className="text-white/90 text-sm font-medium leading-relaxed @[480px]:text-base tracking-wide">
                  Transforme seu visual com nossos especialistas em estética e bem-estar.
                </h2>
              </div>
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center z-10 pt-4">
                <Link href="/agendar" className="flex w-full sm:w-auto min-w-[160px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-6 bg-[#e64c7f] hover:bg-rose-500 transition-colors text-white text-base font-bold leading-normal tracking-[0.015em] shadow-lg shadow-[#e64c7f]/30">
                  <span className="truncate">Solicitar Agendamento</span>
                </Link>
                <Link href="/login" className="flex w-full sm:w-auto min-w-[160px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-6 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white text-base font-bold leading-normal tracking-[0.015em] transition-all">
                  <span className="truncate">Já sou Cliente (Login)</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="flex flex-col gap-4 px-4 pt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-[#111418] dark:text-white text-[24px] font-bold leading-tight tracking-[-0.015em]">Serviços em Destaque</h2>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { title: 'Manicure VIP', desc: 'Esfoliação, cuticulagem e esmaltação premium.', price: '85', link: '/agendar' },
              { title: 'Alongamento em Gel', desc: 'Durabilidade e acabamento ultra natural.', price: '160', link: '/agendar' },
              { title: 'Ritual de Nutrição', desc: 'Tratamento capilar profundo e revitalizante.', price: '120', link: '/agendar' }
            ].map((svc, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl bg-[#f8f6f6] dark:bg-[#2a171d] p-4 pr-3 border border-transparent dark:border-white/5 shadow-sm hover:shadow-md transition-all">
                <div className="flex flex-col gap-1 max-w-[65%]">
                  <h3 className="text-base font-bold text-[#111418] dark:text-white leading-tight">{svc.title}</h3>
                  <p className="text-sm text-[#6b5860] dark:text-[#c695a5] line-clamp-1">{svc.desc}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-sm font-bold text-[#e64c7f]">A partir de R$ {svc.price}</span>
                  <Link href={svc.link} className="flex items-center justify-center rounded-full bg-[#e64c7f]/10 hover:bg-[#e64c7f] text-[#e64c7f] hover:text-white px-3 py-1.5 transition-colors text-xs font-bold">
                    Agendar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Booking Section */}
        <section id="book" className="py-16 md:py-24 bg-gradient-to-b from-white to-fuchsia-50/30 dark:from-slate-950 dark:to-slate-900/50">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-12">
              <span className="inline-block py-1 px-3 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400 text-xs font-bold uppercase tracking-wider mb-3">
                Agendamento Online
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
                Reserve seu Momento
              </h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                Escolha o serviço ideal e o melhor horário para você. Tudo online, rápido e sem complicação.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-100 dark:border-slate-800 overflow-hidden min-h-[600px]">
              <BookingWizard />
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        <section className="flex flex-col pt-8">
          <div className="px-4 flex items-center justify-between">
            <h2 className="text-[#111418] dark:text-white text-[24px] font-bold leading-tight tracking-[-0.015em]">Galeria de Inspiração</h2>
            <a className="text-[#e64c7f] text-sm font-bold hover:underline" href="#">Ver tudo</a>
          </div>
          <p className="px-4 pt-1 text-sm text-[#6b5860] dark:text-[#c695a5]">Resultados reais de nossas clientes</p>
        </section>

        <section className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-4">
              <div className="group relative overflow-hidden rounded-xl aspect-[3/4] cursor-pointer">
                <div className="w-full h-full bg-center bg-no-repeat bg-cover transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBO8dzNU8aJrkzsLgHs7UgQ0CmUYIpsKL3MIR0rh-xOvFouirZwUOa1QsTm_cFmzloaFINDWpSb09XzxeseZu_daazdtgEpDXGDiBSnG8MSNzwGkp32BwLSfujLEs_iOU_KXz7MK3twB00-_i8BR1FvhNpVNRzKqZQ9jAvRecGiWMksUbWm4KRAcamVWeSn_zC27fOkm8lfYWTQZlZKKZfr5cUSJaIQAVVXwlps1fJeCss6d-wDZ3wEOR5QQz3argZ5r_lUYP51wt0")' }}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                  <span className="text-white text-sm font-bold">Corte & Styling</span>
                </div>
              </div>
              <div className="group relative overflow-hidden rounded-xl aspect-[4/5] cursor-pointer">
                <div className="w-full h-full bg-center bg-no-repeat bg-cover transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCmobOyUOFJFfvMqHbobV7nuL5-QzuuMpHHScHr69i-hOeWjigFEzB-v5SdWYDlfRAvOf6Qz_o1vKJd3mjPnNZgbojtxJ1Lnpw1qTbdeEKPDbGoaX_fa8PQOCW7R0N8psSNVxC91fgisqAAwy_wePrDBV7pary9zr8XHLhzIFnPAWse1hSHTX8AS7s86gx4cStdpFDot6MV_4OFYASIW66a2Jk27mQCNcWU8dtwaiOqscJA1-SIfAs0gA6t-MEyxknZT3ttSwrXFyc")' }}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                  <span className="text-white text-sm font-bold">Nail Art</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="group relative overflow-hidden rounded-xl aspect-[4/5] cursor-pointer">
                <div className="w-full h-full bg-center bg-no-repeat bg-cover transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDPNG-lvsxKJaxaefOacXl_wNDUdfYuF4-ZRFEvjowQ0CjhhdbAxgGiS7xvxGW5FGPUBq2wjOHpbie8B9Nl_5QU-IrZWnmGYfgeOC-dALnJ5WZOpDu5F1ecKgdbJ8lS0xu4MR_3ovPFaz5USfw57_RBOc8Q1B4EglU3M1yK7uPd-tvOS5dV3MPxjeulVkamCeeTDqKXrCvIxZukMOj3QOeaj-Vv2Q5KyuxnhonoV1Cav16jVckvu89aWL4P3BWoY7zwUq02NPGM858")' }}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                  <span className="text-white text-sm font-bold">Maquiagem</span>
                </div>
              </div>
              <div className="group relative overflow-hidden rounded-xl aspect-[3/4] cursor-pointer">
                <div className="w-full h-full bg-center bg-no-repeat bg-cover transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDm_Cj4_7iMqpBeydHObAzv3HqWiJSjmIB5S7eSgAtDpgl3odRqu-31eMmg8qIxHW7E8AQy64fYbJOXuyqeG5OYFsaha8GI-RZmcIKS-ovtUL75ifUPjq4Ff5Hn5mzYtw8Dz-apic_LKmuS0oJKT14YFA1C95OAD9ITFsS01Rf2pUmCeSP-O5mzKZp8MsBzcf2OEoEHsoPxMWKMKYK4j1LTKNu8O9yGp8c2rlymuFUwvO3yxnfd8np7lnz1SfVhJxGt0JepXQlx1BU")' }}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                  <span className="text-white text-sm font-bold">Coloração</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="mt-4">
          <h2 className="text-[#111418] dark:text-white text-[24px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3">Sobre Nós</h2>
        </section>
        <section className="px-4 pb-8">
          <div className="flex flex-col gap-4 rounded-xl bg-[#f8f6f6] dark:bg-[#2a171d] p-5 border border-[#e64c7f]/10">
            <p className="text-[#111418] dark:text-[#e0d0d5] text-base leading-relaxed">
              No <span className="text-[#e64c7f] font-bold">Salon Éclat</span>, acreditamos que a beleza é uma forma de expressão pessoal. Nossa equipe de especialistas dedica-se a proporcionar experiências únicas, unindo técnicas de vanguarda com um ambiente acolhedor e sofisticado.
            </p>
            <div className="flex gap-4 pt-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#e64c7f]">verified</span>
                <span className="text-sm font-medium dark:text-white">Certificado</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#e64c7f]">star</span>
                <span className="text-sm font-medium dark:text-white">5 Estrelas</span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-auto bg-[#1a0d11] border-t border-[#e64c7f]/10 text-white">
          <div className="flex flex-col items-center justify-center gap-6 p-8">
            <div className="flex items-center justify-center gap-6">
              <a className="group flex size-12 items-center justify-center rounded-full bg-[#2a171d] hover:bg-[#e64c7f] transition-all duration-300" href="#">
                <span className="material-symbols-outlined text-white/80 group-hover:text-white">photo_camera</span>
              </a>
              <a className="group flex size-12 items-center justify-center rounded-full bg-[#2a171d] hover:bg-[#e64c7f] transition-all duration-300" href="#">
                <span className="material-symbols-outlined text-white/80 group-hover:text-white">public</span>
              </a>
              <a className="group flex size-12 items-center justify-center rounded-full bg-[#2a171d] hover:bg-[#e64c7f] transition-all duration-300" href="#">
                <span className="material-symbols-outlined text-white/80 group-hover:text-white">chat</span>
              </a>
            </div>
            <div className="text-center">
              <p className="text-[#e64c7f] text-lg font-bold">Salon Éclat</p>
              <p className="text-[#c695a5] text-xs mt-1">© 2023 Todos os direitos reservados.</p>
            </div>
          </div>
          <div className="h-5 bg-[#1a0d11]"></div>
        </footer>
      </div>
    </div>
  );
}
