
import React, { useState, useEffect } from 'react';
import { Page, DashboardSubPage } from '../App';
import { UzumakiLogo } from './icons/UzumakiLogo';
import { Search, Bell, User } from 'lucide-react';
import * as db from '../services/dbService';
import { supabase } from '../services/supabaseClient';
import { UserRole } from '../types';

interface HeaderProps {
  onNavigate: (page: Page) => void;
  onDashboardNavigate: (page: DashboardSubPage) => void;
  currentPage: Page;
  isAuthenticated: boolean;
  onLoginClick: () => void;
  onSearchClick: () => void;
  onSwitchRole: (role: UserRole) => void;
  onLogout: () => void;
  isMenuOpen: boolean; 
  setIsMenuOpen: (isOpen: boolean) => void; 
}

export const Header: React.FC<HeaderProps> = ({ 
    onNavigate, onDashboardNavigate, currentPage, isAuthenticated, 
    onLoginClick, onSearchClick, onSwitchRole, onLogout,
    isMenuOpen, setIsMenuOpen 
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
      db.getAppConfig().then(config => {
          if (config['site_logo']) setCustomLogo(config['site_logo']);
      });

      if (isAuthenticated) {
          fetchHeaderData();
          const interval = setInterval(fetchHeaderData, 10000);
          return () => clearInterval(interval);
      }
  }, [isAuthenticated]);

  const fetchHeaderData = async () => {
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
              const [count, profile] = await Promise.all([
                  db.getUnreadNotificationsCount(user.id),
                  db.getUserProfile(user.id)
              ]);
              setUnreadCount(count);
              if (profile) setAvatarUrl(profile.avatar_url);
          }
      } catch (e) { console.error(e); }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[110] bg-gradient-to-b from-black/90 to-transparent pt-4 pb-12 pointer-events-none">
        {/* AI Botlari uchun ko'rinmas lekin crawl-able havolalar (SEO) */}
        <nav className="sr-only">
            <a href="/?page=copyright#privacy-policy">Maxfiylik Siyosati</a>
            <a href="/?page=copyright#public-offer">Ommaviy Oferta</a>
            <a href="/?page=copyright#founders">Asoschilar haqida</a>
        </nav>

        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-10">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => isAuthenticated ? onNavigate('dashboard') : onNavigate('welcome')}>
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-transform hover:scale-110">
                    {customLogo ? (
                        <img src={customLogo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                        <UzumakiLogo className="w-full h-full p-1 text-orange-500 bg-black" />
                    )}
                </div>
            </div>
            <nav className="hidden xl:flex items-center gap-8">
                {['welcome', 'dashboard', 'studio', 'ai-assistant'].map((id) => (
                <button key={id} onClick={() => onNavigate(id as Page)} className={`text-[11px] font-bold uppercase tracking-widest transition-all ${currentPage === id ? 'text-orange-500' : 'text-gray-300 hover:text-white'}`}>
                    {id === 'welcome' ? 'Asosiy' : id === 'dashboard' ? 'Katalog' : id === 'studio' ? 'Fandub' : 'AI Bot'}
                </button>
                ))}
            </nav>
            </div>
            <div className="flex items-center gap-3 sm:gap-5">
                <button onClick={onSearchClick} className="p-2 text-white hover:text-orange-500 transition-colors active:scale-95">
                    <Search size={26} strokeWidth={2.5} />
                </button>
                <button className="p-2 text-white hover:text-orange-500 transition-colors relative active:scale-95 group">
                    <Bell size={26} strokeWidth={2.5} className={unreadCount > 0 ? "animate-bounce" : ""} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 rounded-full border border-black text-[8px] flex items-center justify-center text-white font-black">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
                {isAuthenticated ? (
                    <button onClick={() => setIsMenuOpen(true)} className="w-10 h-10 rounded-full border-2 border-white/20 overflow-hidden hover:border-orange-500 transition-all shadow-lg active:scale-95">
                        {avatarUrl ? <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-400"><User size={20} /></div>}
                    </button>
                ) : (
                    <button onClick={onLoginClick} className="bg-white text-black px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all shadow-lg">Kirish</button>
                )}
            </div>
        </div>
    </header>
  );
};
