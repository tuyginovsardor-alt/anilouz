import React, { useState, useEffect } from 'react';
import { Page } from '../App';
import { UzumakiLogo } from './icons/UzumakiLogo';
import { Search, Bell, User, Menu, X } from 'lucide-react';
import { getUnreadNotificationsCount } from '../services/dbService';
import { supabase } from '../services/supabaseClient';

interface HeaderProps {
  onNavigate: (page: Page) => void;
  currentPage: Page;
  isAuthenticated: boolean;
  onLoginClick: () => void;
  onSearchClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, currentPage, isAuthenticated, onLoginClick, onSearchClick }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
      if (isAuthenticated) {
          const fetchCounts = async () => {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                  const count = await getUnreadNotificationsCount(user.id);
                  setUnreadCount(count);
              }
          };
          fetchCounts();
          const interval = setInterval(fetchCounts, 60000);
          return () => clearInterval(interval);
      }
  }, [isAuthenticated]);

  const navLinks = [
    { id: 'welcome', label: 'Asosiy' },
    { id: 'dashboard', label: 'Katalog' },
    { id: 'ai-assistant', label: 'AI Bot' }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-[110] bg-[#050505] border-b border-white/5">
      <div className="container mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
        
        {/* Logo & Links */}
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => onNavigate('welcome')}>
            <UzumakiLogo className="w-10 h-10" />
            <span className="text-xl md:text-2xl font-black uppercase text-white tracking-tighter">ANILO</span>
          </div>

          <nav className="hidden xl:flex items-center gap-10">
            {navLinks.map((p) => (
              <button key={p.id} onClick={() => onNavigate(p.id as Page)} className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all ${currentPage === p.id ? 'text-orange-500' : 'text-zinc-500 hover:text-white'}`}>
                {p.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tools */}
        <div className="flex items-center gap-6">
          <button onClick={onSearchClick} className="p-2 text-zinc-400 hover:text-white transition-colors"><Search size={20} /></button>

          <button className="p-2 text-zinc-400 hover:text-white transition-colors relative">
            <Bell size={20} />
            {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-orange-600 rounded-full border-2 border-[#050505] text-[8px] flex items-center justify-center text-white font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
          </button>
          
          {isAuthenticated ? (
            <button onClick={() => onNavigate('dashboard')} className="w-10 h-10 rounded-sm border border-white/10 flex items-center justify-center bg-zinc-900 overflow-hidden hover:border-orange-500 transition-all">
                <User size={18} className="text-zinc-400" />
            </button>
          ) : (
            <button onClick={onLoginClick} className="bg-white text-black px-6 py-2.5 rounded-sm font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all">Kirish</button>
          )}
        </div>
      </div>
    </header>
  );
};