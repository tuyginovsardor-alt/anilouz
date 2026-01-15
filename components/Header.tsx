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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
          const interval = setInterval(fetchCounts, 60000); // Har minutda tekshirish
          return () => clearInterval(interval);
      }
  }, [isAuthenticated]);

  const navLinks = [
    { id: 'welcome', label: 'Asosiy' },
    { id: 'dashboard', label: 'Katalog' },
    { id: 'ai-assistant', label: 'AI Bot' }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-[110] glass-header border-b border-white/5">
      <div className="container mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
        
        {/* Logo & Links */}
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => onNavigate('welcome')}>
            <UzumakiLogo className="w-9 h-9 md:w-11 md:h-11 drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]" />
            <span className="text-xl md:text-2xl font-black uppercase bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">ANILO</span>
          </div>

          <nav className="hidden xl:flex items-center gap-8">
            {navLinks.map((p) => (
              <button key={p.id} onClick={() => onNavigate(p.id as Page)} className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all ${currentPage === p.id ? 'text-white' : 'text-gray-500 hover:text-orange-500'}`}>
                {p.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tools */}
        <div className="flex items-center gap-4">
          <button onClick={onSearchClick} className="p-2 text-gray-400 hover:text-white"><Search size={20} /></button>

          <button className="p-2 text-gray-400 hover:text-white relative">
            <Bell size={20} />
            {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-orange-600 rounded-full border-2 border-[#0a0a0c] text-[8px] flex items-center justify-center text-white font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
          </button>
          
          {isAuthenticated ? (
            <button onClick={() => onNavigate('dashboard')} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-gray-800 overflow-hidden">
                <User size={18} className="text-gray-400" />
            </button>
          ) : (
            <button onClick={onLoginClick} className="bg-white text-black px-6 py-2 rounded-xl font-black text-[10px] uppercase">Kirish</button>
          )}

          <button className="xl:hidden p-2 text-gray-400" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>
    </header>
  );
};