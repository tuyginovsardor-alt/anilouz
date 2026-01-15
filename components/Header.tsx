import React, { useState } from 'react';
import { Page } from '../App';
import { UzumakiLogo } from './icons/UzumakiLogo';
import { Search, Bell, User, Menu, X, ChevronDown } from 'lucide-react';

interface HeaderProps {
  onNavigate: (page: Page) => void;
  currentPage: Page;
  isAuthenticated: boolean;
  onLoginClick: () => void;
  onSearchClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, currentPage, isAuthenticated, onLoginClick, onSearchClick }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'welcome', label: 'Bosh sahifa' },
    { id: 'dashboard', label: 'Katalog' },
    { id: 'search', label: 'Kashf etish' },
    { id: 'ai-assistant', label: 'AI Yordamchi' }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-[110] glass-header">
      <div className="container mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
        
        {/* Left: Branding & Desktop Nav */}
        <div className="flex items-center gap-10">
          <div 
            className="flex items-center gap-2 cursor-pointer group" 
            onClick={() => onNavigate('welcome')}
          >
            <UzumakiLogo className="w-10 h-10 drop-shadow-[0_0_10px_rgba(249,115,22,0.5)] group-hover:rotate-180 transition-transform duration-500" />
            <div className="flex flex-col leading-none">
                <span className="text-2xl font-black tracking-tighter uppercase bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x">
                    ANILO
                </span>
                <span className="text-[10px] font-bold text-gray-500 tracking-[0.2em] ml-0.5">PREMIUM</span>
            </div>
          </div>

          {/* Desktop Rich Navigation */}
          <nav className="hidden xl:flex items-center gap-8">
            {navLinks.map((p) => (
              <button
                key={p.id}
                onClick={() => onNavigate(p.id as Page)}
                className={`text-[12px] font-black uppercase tracking-[0.15em] transition-all hover:text-orange-500 relative py-2 ${
                  currentPage === p.id ? 'text-white' : 'text-gray-400'
                }`}
              >
                {p.label}
                {currentPage === p.id && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500 rounded-full"></span>
                )}
              </button>
            ))}
            <div className="group relative">
                <button className="text-[12px] font-black uppercase tracking-[0.15em] text-gray-400 hover:text-white flex items-center gap-1">
                    Janrlar <ChevronDown size={14} />
                </button>
                {/* Simple Dropdown Example */}
                <div className="absolute top-full left-0 mt-2 w-48 bg-[#16161a] border border-white/5 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-2 shadow-2xl">
                    {['Jangari', 'Sarguzasht', 'Komediya', 'Drama'].map(g => (
                        <button key={g} className="w-full text-left px-4 py-2 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">{g}</button>
                    ))}
                </div>
            </div>
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 sm:gap-6">
          <button 
            onClick={onSearchClick}
            className="p-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
            title="Qidiruv"
          >
            <Search size={20} strokeWidth={2.5} />
          </button>

          <button className="p-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all relative">
            <Bell size={20} strokeWidth={2.5} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-orange-600 rounded-full border-2 border-[#0a0a0c]"></span>
          </button>
          
          {isAuthenticated ? (
            <button 
              onClick={() => onNavigate('dashboard')}
              className="w-10 h-10 rounded-full border border-gray-700 p-0.5 hover:border-orange-500 transition-all flex-shrink-0 overflow-hidden"
            >
              <div className="w-full h-full bg-gray-800 rounded-full flex items-center justify-center">
                <User size={18} className="text-gray-400" />
              </div>
            </button>
          ) : (
            <button
              onClick={onLoginClick}
              className="bg-white text-black px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all shadow-xl hidden sm:block"
            >
              Kirish
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            className="xl:hidden p-2 text-gray-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <div className={`xl:hidden fixed inset-x-0 top-20 bg-[#0a0a0c]/95 backdrop-blur-2xl border-b border-white/5 transition-all duration-300 overflow-hidden ${isMobileMenuOpen ? 'max-h-[400px] py-6' : 'max-h-0'}`}>
         <div className="flex flex-col items-center gap-6">
            {navLinks.map((p) => (
              <button
                key={p.id}
                onClick={() => { onNavigate(p.id as Page); setIsMobileMenuOpen(false); }}
                className={`text-sm font-black uppercase tracking-widest ${currentPage === p.id ? 'text-orange-500' : 'text-gray-400'}`}
              >
                {p.label}
              </button>
            ))}
            {!isAuthenticated && (
                <button onClick={onLoginClick} className="w-[80%] py-4 bg-white text-black font-black rounded-2xl uppercase tracking-widest text-xs">Tizimga kirish</button>
            )}
         </div>
      </div>
    </header>
  );
};