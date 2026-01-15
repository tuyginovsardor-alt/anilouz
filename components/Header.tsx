import React, { useState } from 'react';
import { Page } from '../App';
import { UzumakiLogo } from './icons/UzumakiLogo';
import { Search, Bell, User, Menu, X, ChevronDown, LayoutGrid } from 'lucide-react';

interface HeaderProps {
  onNavigate: (page: Page) => void;
  currentPage: Page;
  isAuthenticated: boolean;
  onLoginClick: () => void;
  onSearchClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, currentPage, isAuthenticated, onLoginClick, onSearchClick }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Mobil uchun "Bosh sahifa" va "Katalog"ni Dashboard orqali birlashtiramiz
  const navLinks = [
    { id: 'welcome', label: 'Asosiy' },
    { id: 'dashboard', label: 'Katalog' },
    { id: 'ai-assistant', label: 'AI Bot' }
  ];

  const handleNav = (id: string) => {
      onNavigate(id as Page);
      setIsMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[110] glass-header border-b border-white/5">
      <div className="container mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
        
        {/* Left: Logo & Desktop Links */}
        <div className="flex items-center gap-10">
          <div 
            className="flex items-center gap-2 cursor-pointer group" 
            onClick={() => onNavigate('welcome')}
          >
            <UzumakiLogo className="w-9 h-9 md:w-11 md:h-11 drop-shadow-[0_0_15px_rgba(249,115,22,0.4)] group-hover:rotate-180 transition-transform duration-700" />
            <div className="flex flex-col leading-none">
                <span className="text-xl md:text-2xl font-black tracking-tighter uppercase bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x">
                    ANILO
                </span>
                <span className="text-[9px] font-bold text-gray-500 tracking-[0.2em] ml-0.5">PREMIUM</span>
            </div>
          </div>

          <nav className="hidden xl:flex items-center gap-10">
            {navLinks.map((p) => (
              <button
                key={p.id}
                onClick={() => onNavigate(p.id as Page)}
                className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:text-orange-500 relative py-2 ${
                  currentPage === p.id ? 'text-white' : 'text-gray-500'
                }`}
              >
                {p.label}
                {currentPage === p.id && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-600 rounded-full shadow-[0_0_10px_rgba(234,88,12,0.8)]"></span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Right: Tools */}
        <div className="flex items-center gap-2 sm:gap-6">
          <button 
            onClick={onSearchClick}
            className="p-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
          >
            <Search size={20} strokeWidth={2.5} />
          </button>

          <button className="hidden sm:block p-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all relative">
            <Bell size={20} strokeWidth={2.5} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-orange-600 rounded-full border-2 border-[#0a0a0c]"></span>
          </button>
          
          {isAuthenticated ? (
            <button 
              onClick={() => handleNav('dashboard')}
              className="w-9 h-9 md:w-11 md:h-11 rounded-full border-2 border-white/5 p-0.5 hover:border-orange-500 transition-all flex-shrink-0 overflow-hidden shadow-2xl"
            >
              <div className="w-full h-full bg-gray-800 rounded-full flex items-center justify-center">
                <User size={18} className="text-gray-400" />
              </div>
            </button>
          ) : (
            <button
              onClick={onLoginClick}
              className="bg-white text-black px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all shadow-2xl hidden sm:block"
            >
              Kirish
            </button>
          )}

          {/* Mobile Menu Icon */}
          <button 
            className="xl:hidden p-2 text-gray-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Modern Mobile Drawer */}
      <div className={`xl:hidden fixed inset-x-0 top-20 bg-[#0a0a0c]/98 backdrop-blur-3xl border-b border-white/5 transition-all duration-500 ease-in-out overflow-hidden shadow-2xl ${isMobileMenuOpen ? 'max-h-[500px] py-10' : 'max-h-0'}`}>
         <div className="flex flex-col items-center gap-8">
            {navLinks.map((p) => (
              <button
                key={p.id}
                onClick={() => handleNav(p.id)}
                className={`text-lg font-black uppercase tracking-[0.25em] ${currentPage === p.id ? 'text-orange-500' : 'text-gray-500'} hover:text-white transition-colors`}
              >
                {p.label}
              </button>
            ))}
            {!isAuthenticated && (
                <button 
                  onClick={() => { onLoginClick(); setIsMobileMenuOpen(false); }} 
                  className="w-[70%] py-5 bg-orange-600 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-2xl shadow-orange-600/30"
                >
                  Tizimga kirish
                </button>
            )}
         </div>
      </div>
    </header>
  );
};