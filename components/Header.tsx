
import React, { useState, useEffect } from 'react';
import { Page, DashboardSubPage } from '../App';
import { UzumakiLogo } from './icons/UzumakiLogo';
import { Search, Bell, User, Play, Mic, Sparkles } from 'lucide-react';
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
          // Real vaqtda bildirishnomalarni tekshirish (Polling)
          const interval = setInterval(fetchHeaderData, 15000); // 15 sekundda bir
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

  const handleLogoClick = () => {
      if (isAuthenticated) onNavigate('dashboard');
      else onNavigate('welcome');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[110] bg-gradient-to-b from-black/90 to-transparent pt-4 pb-12 pointer-events-none">
        <div className="container mx-auto px-4 md:px-8 h-20 flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-10">
                {/* LOGO */}
                <div className="flex items-center gap-3 cursor-pointer group" onClick={handleLogoClick}>
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-transform hover:scale-110">
                        {customLogo ? (
                            <img src={customLogo} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                            <UzumakiLogo className="w-full h-full p-1 text-orange-500 bg-black" />
                        )}
                    </div>
                </div>

                {/* NEW PROFESSIONAL NAVIGATION (2 ITEMS) */}
                <nav className="hidden xl:flex items-center gap-4">
                    {/* Item 1: Katalog */}
                    <button
                        onClick={() => onNavigate('dashboard')}
                        className={`group flex items-center gap-3 px-5 py-2.5 rounded-2xl transition-all duration-300 border ${
                            currentPage === 'dashboard' || currentPage === 'welcome' 
                            ? 'bg-white/10 border-white/10 backdrop-blur-md' 
                            : 'hover:bg-white/5 border-transparent'
                        }`}
                    >
                        <div className={`p-2 rounded-xl transition-all ${
                            currentPage === 'dashboard' || currentPage === 'welcome' 
                            ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30' 
                            : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700 group-hover:text-white'
                        }`}>
                            <Play size={20} fill={currentPage === 'dashboard' ? "currentColor" : "none"} />
                        </div>
                        <div className="text-left">
                            <p className={`text-sm font-black uppercase tracking-wide leading-none ${
                                currentPage === 'dashboard' || currentPage === 'welcome' ? 'text-white' : 'text-zinc-400 group-hover:text-white'
                            }`}>
                                Katalog
                            </p>
                            <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1 group-hover:text-zinc-500 transition-colors">
                                Onlayn Kinoteatr
                            </p>
                        </div>
                    </button>

                    {/* Item 2: Fandub */}
                    <button
                        onClick={() => onNavigate('studio')}
                        className={`group flex items-center gap-3 px-5 py-2.5 rounded-2xl transition-all duration-300 border ${
                            currentPage === 'studio' 
                            ? 'bg-white/10 border-white/10 backdrop-blur-md' 
                            : 'hover:bg-white/5 border-transparent'
                        }`}
                    >
                        <div className={`p-2 rounded-xl transition-all ${
                            currentPage === 'studio' 
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' 
                            : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700 group-hover:text-white'
                        }`}>
                            <Mic size={20} />
                        </div>
                        <div className="text-left">
                            <p className={`text-sm font-black uppercase tracking-wide leading-none ${
                                currentPage === 'studio' ? 'text-white' : 'text-zinc-400 group-hover:text-white'
                            }`}>
                                Fandub
                            </p>
                            <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1 group-hover:text-zinc-500 transition-colors">
                                Ijodkorlar Studiyasi
                            </p>
                        </div>
                    </button>
                </nav>
            </div>

            {/* RIGHT SIDE ACTIONS */}
            <div className="flex items-center gap-3 sm:gap-4">
                {/* AI Assistant (Moved here) */}
                <button 
                    onClick={() => onNavigate('ai-assistant')} 
                    className={`p-2.5 rounded-xl transition-all active:scale-95 group ${currentPage === 'ai-assistant' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-zinc-400 hover:text-blue-400 hover:bg-white/5'}`}
                    title="AI Yordamchi"
                >
                    <Sparkles size={22} strokeWidth={2} className={currentPage === 'ai-assistant' ? 'animate-pulse' : ''}/>
                </button>

                <div className="h-8 w-px bg-white/10 mx-1 hidden sm:block"></div>

                <button onClick={onSearchClick} className="p-2 text-white hover:text-orange-500 transition-colors drop-shadow-md active:scale-95">
                    <Search size={26} strokeWidth={2.5} />
                </button>
                
                <button className="p-2 text-white hover:text-orange-500 transition-colors relative drop-shadow-md active:scale-95 group">
                    <Bell size={26} strokeWidth={2.5} className={unreadCount > 0 ? "animate-swing" : ""} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 rounded-full border border-black text-[8px] flex items-center justify-center text-white font-black animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>

                {isAuthenticated ? (
                    <div className="hidden md:flex items-center ml-2">
                        <button onClick={() => setIsMenuOpen(true)} className="w-11 h-11 rounded-full border-2 border-white/20 overflow-hidden hover:border-orange-500 transition-all shadow-lg active:scale-95 group">
                            {avatarUrl ? <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover group-hover:scale-110 transition-transform" /> : <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-400"><User size={22} /></div>}
                        </button>
                    </div>
                ) : (
                    <button onClick={onLoginClick} className="ml-2 bg-white text-black px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all shadow-lg active:scale-95">Kirish</button>
                )}
            </div>
        </div>
    </header>
  );
};
