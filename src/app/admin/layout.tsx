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
      
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-slate-900 p-4 flex justify-between items-center shadow-lg border-b border-slate-800 z-30 relative">
        <div className="flex items-center space-x-3">
             {session?.user?.image ? (
                <img 
                    src={session.user.image} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full border-2 border-fuchsia-500/50"
                />
             ) : (
                <div className="w-10 h-10 rounded-full bg-fuchsia-900/50 flex items-center justify-center border-2 border-fuchsia-500/30 text-fuchsia-300 font-bold">
                    {session?.user?.name?.[0] || 'A'}
                </div>
             )}
             <span className="font-bold text-xl text-fuchsia-500">ManicureApp</span> 
        </div>
        <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-slate-400 hover:bg-slate-800 rounded-lg"
        >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/70 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
      )}

      {/* Sidebar */}
      <aside className={`
            fixed md:relative top-0 right-0 md:left-0 h-full w-56 md:w-64 bg-slate-900 border-l md:border-l-0 md:border-r border-slate-800 p-6 flex-shrink-0 z-50 transition-transform duration-300 ease-in-out md:translate-x-0
            ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        <div className="mb-10 flex flex-col gap-4 hidden md:flex">
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
        
        <div className="md:hidden mb-6 flex justify-between items-center">
             <span className="text-slate-500 text-sm uppercase font-bold tracking-wider">Menu</span>
             <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400">
                <X size={20} />
             </button>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center space-x-3 p-3 rounded-xl transition-all font-medium ${pathname === item.href ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 shadow-[0_0_15px_rgba(232,121,249,0.1)]' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
            >
              <span className="opacity-80">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Footer Logout Button */}
        <div className="absolute bottom-6 left-6 right-6">
            <button 
                onClick={async () => {
                   await fetch('/api/auth/logout', { method: 'POST' });
                   window.location.href = '/admin/login';
                }}
                className="flex items-center space-x-3 p-3 w-full rounded-xl text-slate-500 hover:bg-red-900/10 hover:text-red-400 transition-colors"
            >
                 <LogOut size={20} />
                 <span>Sair</span>
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
    </SidebarContext.Provider>
  );
}
