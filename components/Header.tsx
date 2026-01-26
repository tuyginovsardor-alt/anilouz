
import React, { useState, useEffect, useRef } from 'react';
import { Page, DashboardSubPage } from '../App';
import { UzumakiLogo } from './icons/UzumakiLogo';
import { Search, Bell, User, Play, Mic, Sparkles } from 'lucide-react';
import * as db from '../services/dbService';
import { supabase } from '../services/supabaseClient';
import { UserRole } from '../types';
import { useNotification } from '../hooks/useNotification';
import { NotificationList } from './NotificationList';

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
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const { addNotification } = useNotification();
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      db.getAppConfig().then(config => {
          if (config['site_logo']) setCustomLogo(config['site_logo']);
      });

      if (isAuthenticated) {
          fetchHeaderData();
          const interval = setInterval(fetchHeaderData, 15000);
          return () => clearInterval(interval);
      }
  }, [isAuthenticated]);

  // Handle profile updates from anywhere
  useEffect(() => {
      const refreshHeader = () => fetchHeaderData();
      document.addEventListener('profileUpdated', refreshHeader);
      return () => document.removeEventListener('profileUpdated', refreshHeader);
  }, [isAuthenticated]);

  const fetchHeaderData = async () => {
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
              const [count, profile, list] = await Promise.all([
                  db.getUnreadNotificationsCount(user.id),
                  db.getUserProfile(user.id),
                  db.getUserNotifications(user.id)
              ]);
              setUnreadCount(count);
              setNotifications(list);
              if (profile) setAvatarUrl(profile.avatar_url);
          }
      } catch (e) { console.error(e); }
  };

  const handleToggleNotifications = async () => {
      if (!showNotifications && isAuthenticated) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
              await db.markNotificationsRead(user.id);
              setUnreadCount(0);
          }
      }
      setShowNotifications(!showNotifications);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[110] bg-gradient-to-b from-black/90 to-transparent pt-4 pb-12 pointer-events-none">
        <div className="container mx-auto px-4 md:px-8 h-20 flex items-center justify-between pointer-events-auto">
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

                <nav className="hidden xl:flex items-center gap-4">
                    <button onClick={() => onNavigate('dashboard')} className={`group flex items-center gap-3 px-5 py-2.5 rounded-2xl transition-all ${currentPage === 'dashboard' ? 'bg-white/10 border-white/10' : 'hover:bg-white/5 border-transparent'}`}>
                        <Play size={20} fill={currentPage === 'dashboard' ? "currentColor" : "none"} className={currentPage === 'dashboard' ? 'text-orange-600' : 'text-zinc-500'} />
                        <p className="text-sm font-black uppercase tracking-wide">Katalog</p>
                    </button>
                    <button onClick={() => onNavigate('studio')} className={`group flex items-center gap-3 px-5 py-2.5 rounded-2xl transition-all ${currentPage === 'studio' ? 'bg-white/10 border-white/10' : 'hover:bg-white/5 border-transparent'}`}>
                        <Mic size={20} className={currentPage === 'studio' ? 'text-purple-600' : 'text-zinc-500'} />
                        <p className="text-sm font-black uppercase tracking-wide">Fandub</p>
                    </button>
                </nav>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 relative" ref={notificationRef}>
                <button onClick={() => onNavigate('ai-assistant')} className={`p-2.5 rounded-xl transition-all active:scale-95 ${currentPage === 'ai-assistant' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-blue-400'}`}>
                    <Sparkles size={22} className={currentPage === 'ai-assistant' ? 'animate-pulse' : ''}/>
                </button>

                <button onClick={onSearchClick} className="p-2 text-white hover:text-orange-500 transition-colors active:scale-95">
                    <Search size={26} strokeWidth={2.5} />
                </button>
                
                <div className="relative">
                    <button onClick={handleToggleNotifications} className="p-2 text-white hover:text-orange-500 transition-colors relative active:scale-95 group">
                        <Bell size={26} strokeWidth={2.5} className={unreadCount > 0 ? "animate-swing text-orange-500" : ""} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 rounded-full border border-black text-[8px] flex items-center justify-center text-white font-black animate-pulse">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                    {showNotifications && <NotificationList notifications={notifications} onClose={() => setShowNotifications(false)} />}
                </div>

                {/* HIDDEN ON MOBILE - MOVED TO BOTTOM NAV */}
                <div className="hidden md:block">
                    {isAuthenticated ? (
                        <button onClick={() => setIsMenuOpen(true)} className="w-11 h-11 rounded-full border-2 border-white/20 overflow-hidden hover:border-orange-500 transition-all shadow-lg active:scale-95">
                            {avatarUrl ? <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-400"><User size={22} /></div>}
                        </button>
                    ) : (
                        <button onClick={onLoginClick} className="ml-2 bg-white text-black px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all shadow-lg">Kirish</button>
                    )}
                </div>
            </div>
        </div>
    </header>
  );
};
