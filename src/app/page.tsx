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
              <div className="flex items-center justify-center gap-4 pt-3 z-10">
                <a
                  className="group flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-white/90 hover:text-white hover:border-[#e64c7f] transition-all"
                  href="https://wa.me/5534992491811"
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg aria-hidden="true" viewBox="0 0 32 32" className="h-4 w-4 fill-current">
                    <path d="M19.11 17.45c-.27-.13-1.6-.79-1.85-.88-.25-.09-.43-.13-.6.13-.17.27-.69.88-.85 1.06-.16.18-.31.2-.58.07-.27-.13-1.13-.42-2.15-1.33-.79-.7-1.32-1.57-1.47-1.83-.15-.27-.02-.41.11-.55.12-.12.27-.31.4-.46.13-.15.18-.27.27-.45.09-.18.04-.34-.02-.47-.07-.13-.6-1.45-.82-1.98-.22-.52-.44-.45-.6-.46h-.51c-.18 0-.47.07-.71.34-.24.27-.93.91-.93 2.22 0 1.31.96 2.57 1.09 2.75.13.18 1.89 2.88 4.58 4.04.64.28 1.14.45 1.53.58.64.2 1.22.17 1.68.1.51-.08 1.6-.65 1.82-1.28.23-.63.23-1.17.16-1.28-.07-.11-.25-.18-.52-.31zM16.01 5.33c-5.84 0-10.58 4.53-10.58 10.12 0 1.79.49 3.54 1.43 5.07L5 27l6.79-1.9c1.49.8 3.18 1.22 4.92 1.22 5.84 0 10.58-4.53 10.58-10.12 0-2.69-1.11-5.23-3.13-7.13-2.01-1.9-4.69-2.94-7.15-2.94zm0 19.04c-1.58 0-3.13-.41-4.47-1.17l-.32-.18-4.03 1.13 1.1-3.75-.21-.34c-.87-1.41-1.33-3.02-1.33-4.66 0-4.74 4.05-8.59 9.05-8.59 2.41 0 4.67.93 6.38 2.54 1.71 1.61 2.65 3.75 2.65 6.05 0 4.74-4.05 8.59-9.05 8.59z"/>
                  </svg>
                  <span className="text-sm font-semibold">WhatsApp</span>
                </a>
                <a
                  className="group flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-white/90 hover:text-white hover:border-[#e64c7f] transition-all"
                  href="https://instagram.com/freiresuene"
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                    <path d="M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm10 2c1.654 0 3 1.346 3 3v10c0 1.654-1.346 3-3 3H7c-1.654 0-3-1.346-3-3V7c0-1.654 1.346-3 3-3h10zm-5 3.5A5.5 5.5 0 1 0 17.5 13 5.507 5.507 0 0 0 12 7.5zm0 2A3.5 3.5 0 1 1 8.5 13 3.504 3.504 0 0 1 12 9.5zm5.75-4.25a1 1 0 1 0 1 1 1 1 0 0 0-1-1z"/>
                  </svg>
                  <span className="text-sm font-semibold">Instagram</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
