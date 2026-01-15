import React from 'react';
import { Page } from '../App';
import { UzumakiLogo } from './icons/UzumakiLogo';
import { Search, Bell, User } from 'lucide-react';

interface HeaderProps {
  onNavigate: (page: Page) => void;
  currentPage: Page;
  isAuthenticated: boolean;
  onLoginClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, currentPage, isAuthenticated, onLoginClick }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-[100] glass-header">
      <div className="container mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
        {/* Left: Logo & Nav */}
        <div className="flex items-center gap-10">
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => onNavigate('welcome')}
          >
            <UzumakiLogo className="w-10 h-10 shadow-lg" />
            <span className="text-2xl font-black tracking-tighter hidden md:block">ANILO</span>
          </div>

          <nav className="hidden lg:flex items-center gap-8">
            {['welcome', 'dashboard', 'search'].map((p) => (
              <button
                key={p}
                onClick={() => onNavigate(p as Page)}
                className={`text-sm font-bold uppercase tracking-widest transition-colors ${
                  currentPage === p ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {p === 'welcome' ? 'Home' : p === 'dashboard' ? 'My Movies' : 'Discover'}
              </button>
            ))}
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-6">
          <button className="text-gray-300 hover:text-white transition-colors">
            <Search size={22} strokeWidth={2.5} />
          </button>
          <button className="text-gray-300 hover:text-white transition-colors relative">
            <Bell size={22} strokeWidth={2.5} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
          </button>
          
          {isAuthenticated ? (
            <button 
              onClick={() => onNavigate('dashboard')}
              className="w-10 h-10 rounded-full border-2 border-gray-700 overflow-hidden hover:border-white transition-all"
            >
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <User size={20} className="text-gray-400" />
              </div>
            </button>
          ) : (
            <button
              onClick={onLoginClick}
              className="bg-white text-black px-6 py-2.5 rounded-full font-black text-sm uppercase tracking-wider hover:bg-gray-200 transition-all shadow-xl"
            >
              Log In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};