
import React, { useState, useEffect } from 'react';
import { Page, DashboardSubPage } from '../App';
import { UzumakiLogo } from './icons/UzumakiLogo';
import { Search, Bell, Menu } from 'lucide-react';
import { getUnreadNotificationsCount, getUserProfile, getAppConfig } from '../services/dbService';
import { supabase } from '../services/supabaseClient';
import { UserRole } from '../types';
import { HamburgerMenu } from './HamburgerMenu';

interface HeaderProps {
  onNavigate: (page: Page) => void;
  onDashboardNavigate: (page: DashboardSubPage) => void;
  currentPage: Page;
  isAuthenticated: boolean;
  onLoginClick: () => void;
  onSearchClick: () => void;
  onSwitchRole: (role: UserRole) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
    onNavigate, onDashboardNavigate, currentPage, isAuthenticated, 
    onLoginClick, onSearchClick, onSwitchRole, onLogout 
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [customLogo, setCustomLogo] = useState<string | null>(null);

  useEffect(() => {
      // Fetch dynamic logo from config
      getAppConfig().then(config => {
          if (config['site_logo']) setCustomLogo(config['site_logo']);
      });

      if (isAuthenticated) {
          const fetchHeaderData = async () => {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                  const [count, profile] = await Promise.all([
                      getUnreadNotificationsCount(user.id),
                      getUserProfile(user.id)
                  ]);
                  setUnreadCount(count);
                  if (profile) setUserRole(profile.role);
              }
          };
          fetchHeaderData();
          const interval = setInterval(fetchHeaderData, 60000);
          return () => clearInterval(interval);
      }
  }, [isAuthenticated]);

  const navLinks = [
    { id: 'welcome', label: 'Asosiy' },
    { id: 'dashboard', label: 'Katalog' },
    { id: 'studio', label: 'Studio' },
    { id: 'ai-assistant', label: 'AI Bot' }
  ];

  return (
    <>
        {/* Background is lighter gradient to make transparent icons visible but blending */}
        <header className="fixed top-0 left-0 right-0 z-[110] bg-gradient-to-b from-black/90 to-transparent pt-4 pb-12 pointer-events-none">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between pointer-events-auto">
            
            {/* Logo & Links */}
            <div className="flex items-center gap-10">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('welcome')}>
                {customLogo ? (
                    <img src={customLogo} alt="Logo" className="w-10 h-10 object-contain drop-shadow-lg" />
                ) : (
                    <UzumakiLogo className="w-9 h-9 text-orange-500 drop-shadow-md" />
                )}
                <span className="text-xl md:text-2xl font-black uppercase text-white tracking-tighter drop-shadow-md">ANILO</span>
            </div>

            <nav className="hidden xl:flex items-center gap-8">
                {navLinks.map((p) => (
                <button key={p.id} onClick={() => onNavigate(p.id as Page)} className={`text-[11px] font-bold uppercase tracking-widest transition-all drop-shadow-md ${currentPage === p.id ? 'text-orange-500' : 'text-gray-300 hover:text-white'}`}>
                    {p.label}
                </button>
                ))}
            </nav>
            </div>

            {/* Tools - RAMKASIZ (No Borders/Backgrounds) */}
            <div className="flex items-center gap-2 sm:gap-4">
                <button onClick={onSearchClick} className="p-2 text-white hover:text-orange-500 transition-colors drop-shadow-md active:scale-95">
                    <Search size={26} strokeWidth={2.5} />
                </button>

                <button className="p-2 text-white hover:text-orange-500 transition-colors relative drop-shadow-md active:scale-95">
                    <Bell size={26} strokeWidth={2.5} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-orange-600 rounded-full border border-black text-[8px] flex items-center justify-center text-white font-bold">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
                
                {isAuthenticated ? (
                    <div className="flex items-center ml-1">
                        <button onClick={() => setIsMenuOpen(true)} className="p-2 text-white hover:text-orange-500 transition-colors drop-shadow-md active:scale-95">
                            <Menu size={28} strokeWidth={2.5} />
                        </button>
                    </div>
                ) : (
                    <button onClick={onLoginClick} className="ml-2 bg-white text-black px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all shadow-lg">Kirish</button>
                )}
            </div>
        </div>
        </header>

        <HamburgerMenu 
            isOpen={isMenuOpen} 
            onClose={() => setIsMenuOpen(false)} 
            onLogout={onLogout}
            onMainNavigate={onNavigate}
            onDashboardNavigate={onDashboardNavigate}
            onSwitchRole={onSwitchRole}
        />
    </>
  );
};
