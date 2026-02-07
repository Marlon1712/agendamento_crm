'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { SidebarContext } from '@/context/SidebarContext';
import {
  LayoutDashboard,
  Calendar,
  DollarSign,
  Scissors,
  Clock,
  Ban,
  Users,
  Menu,
  X,
  LogOut
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Agenda', href: '/admin/calendar', icon: <Calendar size={20} /> },
    { name: 'Financeiro', href: '/admin/finance', icon: <DollarSign size={20} /> },
    { name: 'Serviços', href: '/admin/services', icon: <Scissors size={20} /> },
    { name: 'Horários', href: '/admin/schedule', icon: <Clock size={20} /> },
    { name: 'Bloqueios', href: '/admin/exceptions', icon: <Ban size={20} /> },
    { name: 'Usuários', href: '/admin/users', icon: <Users size={20} /> },
  ];

  if (pathname === '/admin/login') return <>{children}</>;

  return (
    <SidebarContext.Provider value={{ isOpen: isSidebarOpen, setIsOpen: setIsSidebarOpen, toggleSidebar }}>
      <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row relative text-slate-200">

        {/* Sidebar (Desktop Only) */}
        <aside className="hidden md:flex fixed md:relative top-0 left-0 h-full w-64 bg-slate-900 border-r border-slate-800 p-6 flex-col z-50">
          <div className="mb-10 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt="Profile"
                  className="w-12 h-12 rounded-full border-2 border-fuchsia-500/50 shadow-lg shadow-fuchsia-900/20"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-fuchsia-900/50 flex items-center justify-center border-2 border-fuchsia-500/30 text-fuchsia-300 font-bold text-lg">
                  {session?.user?.name?.[0] || 'A'}
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-white font-bold leading-tight">{session?.user?.name?.split(' ')[0]}</span>
                <span className="text-xs text-slate-500">Administrador</span>
              </div>
            </div>
            {/* Divider */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
          </div>

          <nav className="flex-1 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                            flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                            ${isActive
                      ? 'bg-gradient-to-r from-fuchsia-600 to-fuchsia-700 text-white shadow-lg shadow-fuchsia-900/20'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }
                        `}
                >
                  <span className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-fuchsia-400 transition-colors'}`}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.name}</span>

                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-sm"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-800">
            <Link
              href="/api/auth/signout"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition-all duration-200"
            >
              <LogOut size={20} />
              <span className="font-medium">Sair</span>
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 w-full relative pb-28 md:pb-0 overflow-x-hidden">
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* Bottom Navigation (Mobile Only) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-2xl z-10 flex justify-between items-center px-6 py-3 pb-6 rounded-t-3xl">
          <Link href="/admin/dashboard" className={`flex flex-col items-center gap-1 transition-colors ${pathname === '/admin/dashboard' ? 'text-fuchsia-600 dark:text-fuchsia-500' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
            <LayoutDashboard size={24} strokeWidth={pathname === '/admin/dashboard' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">Início</span>
          </Link>
          <Link href="/admin/calendar" className={`flex flex-col items-center gap-1 transition-colors ${pathname === '/admin/calendar' ? 'text-fuchsia-600 dark:text-fuchsia-500' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
            <Calendar size={24} strokeWidth={pathname === '/admin/calendar' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">Agenda</span>
          </Link>

          {/* Center FAB Style for Services or Add? Keeping standard linear as per image request */}
          <Link href="/admin/services" className={`flex flex-col items-center gap-1 transition-colors ${pathname === '/admin/services' ? 'text-fuchsia-600 dark:text-fuchsia-500' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
            <Scissors size={24} strokeWidth={pathname === '/admin/services' ? 2.5 : 2} className={pathname === '/admin/services' ? '-rotate-90' : ''} />
            <span className="text-[10px] font-bold">Serviços</span>
          </Link>

          <Link href="/admin/finance" className={`flex flex-col items-center gap-1 transition-colors ${pathname === '/admin/finance' ? 'text-fuchsia-600 dark:text-fuchsia-500' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
            <DollarSign size={24} strokeWidth={pathname === '/admin/finance' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">Financeiro</span>
          </Link>
          <Link href="/admin/users" className={`flex flex-col items-center gap-1 transition-colors ${pathname === '/admin/users' ? 'text-fuchsia-600 dark:text-fuchsia-500' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
            <Users size={24} strokeWidth={pathname === '/admin/users' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">Perfil</span>
          </Link>
        </div>

      </div>
    </SidebarContext.Provider>
  );
}
