import React, { useState, useEffect, useRef } from 'react';
import { Page, DashboardSubPage } from '../App';
import { UzumakiLogo } from './icons/UzumakiLogo';
import { Search, Bell, User, Play, Mic, Sparkles, Download, Moon, Clock } from 'lucide-react';
import * as db from '../services/dbService';
import { supabase } from '../services/supabaseClient';
import { UserRole } from '../types';
import { NotificationList } from './NotificationList';
import { usePWA } from './InstallPWA'; 

const RAMADAN_START_DATE = new Date("2025-03-01T00:00:00");
const REGIONS: Record<string, number> = {
    "Toshkent": 0, "Andijon": -10, "Namangan": -8, "Farg'ona": -9, "Jizzax": 5,
    "Sirdaryo": 2, "Samarqand": 8, "Buxoro": 18, "Navoiy": 12, "Xorazm": 30,
    "Nukus": 35, "Qashqadaryo": 15, "Surxondaryo": 12
};

export const Header: React.FC<any> = ({ 
    onNavigate, onDashboardNavigate, currentPage, isAuthenticated, 
    onLoginClick, onSearchClick, onSwitchRole, onLogout,
    isMenuOpen, setIsMenuOpen 
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [ramazonText, setRamazonText] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const notificationRef = useRef<HTMLDivElement>(null);
  
  const { isInstallable, installApp } = usePWA(); 

  // Real-vaqt soati
  useEffect(() => {
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

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

  // Ramazon Taymer Logikasi
  useEffect(() => {
      const updateTimer = () => {
          const now = new Date();
          const region = localStorage.getItem('anilo_ramazon_region') || 'Toshkent';
          const offset = REGIONS[region] || 0;
          
          if (now < RAMADAN_START_DATE) {
              const diff = RAMADAN_START_DATE.getTime() - now.getTime();
              const days = Math.floor(diff / (1000 * 60 * 60 * 24));
              const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
              setRamazonText(`${days}k ${hours}s`);
          } else {
              const [h, m] = [now.getHours(), now.getMinutes()];
              const currentTotal = h * 60 + m;
              const saharTotal = (5 * 60 + 15) + offset;
              const iftarTotal = (18 * 60 + 20) + offset;

              if (currentTotal < saharTotal) {
                  const diff = saharTotal - currentTotal;
                  setRamazonText(`Sahar: ${Math.floor(diff/60)}:${String(diff%60).padStart(2,'0')}`);
              } else if (currentTotal < iftarTotal) {
                  const diff = iftarTotal - currentTotal;
                  setRamazonText(`Iftor: ${Math.floor(diff/60)}:${String(diff%60).padStart(2,'0')}`);
              } else {
                  setRamazonText("Iftor o'tdi");
              }
          }
      };

      const ramadanInterval = setInterval(updateTimer, 60000);
      updateTimer();
      return () => clearInterval(ramadanInterval);
  }, []);

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
            <div className="flex items-center gap-3 md:gap-8">
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => isAuthenticated ? onNavigate('dashboard') : onNavigate('welcome')}>
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-transform hover:scale-110">
                        {customLogo ? (
                            <img src={customLogo} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                            <UzumakiLogo className="w-full h-full p-1 text-orange-500 bg-black" />
                        )}
                    </div>
                    {/* DIGITAL CLOCK NEXT TO LOGO */}
                    <div className="hidden sm:flex flex-col justify-center border-l border-white/10 pl-3 h-8">
                        <span className="text-white font-black text-sm tracking-tighter leading-none">
                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[7px] text-orange-500 font-bold uppercase tracking-widest mt-0.5">Hozirgi Vaqt</span>
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

            <div className="flex items-center gap-2 sm:gap-4 relative" ref={notificationRef}>
                
                {/* RAMAZON HEADER WIDGET */}
                <button 
                    onClick={() => onNavigate('ramazon')}
                    className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-600/20 to-yellow-600/10 border border-orange-500/30 rounded-xl hover:scale-105 transition-all group shadow-lg shadow-orange-900/10"
                >
                    <Moon size={16} className="text-orange-500 animate-pulse fill-orange-500/20" />
                    <span className="text-[10px] font-black text-white uppercase tracking-tighter hidden sm:inline">{ramazonText}</span>
                    <span className="text-[8px] font-black text-white uppercase sm:hidden">{ramazonText}</span>
                </button>

                {isInstallable && (
                    <button onClick={installApp} className="p-2 md:p-2.5 rounded-xl bg-orange-600/20 text-orange-500 hover:bg-orange-600 hover:text-white transition-all active:scale-95 border border-orange-600/30">
                        <Download size={20} />
                    </button>
                )}

                <button onClick={() => onNavigate('ai-assistant')} className={`p-2 md:p-2.5 rounded-xl transition-all active:scale-95 ${currentPage === 'ai-assistant' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-blue-400'}`}>
                    <Sparkles size={22} />
                </button>

                <button onClick={onSearchClick} className="p-2 text-white hover:text-orange-500 transition-colors active:scale-95">
                    <Search size={24} strokeWidth={2.5} />
                </button>
                
                <div className="relative">
                    <button onClick={handleToggleNotifications} className="p-2 text-white hover:text-orange-500 transition-colors relative active:scale-95 group">
                        <Bell size={24} strokeWidth={2.5} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-red-600 rounded-full border border-black text-[8px] flex items-center justify-center text-white font-black animate-pulse">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                    {showNotifications && <NotificationList notifications={notifications} onClose={() => setShowNotifications(false)} />}
                </div>

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