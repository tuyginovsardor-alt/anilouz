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
            <UzumakiLogo className="w-10 h-10 shadow-xl" />
            <span className="text-xl font-black tracking-tighter hidden sm:block uppercase">Anilo</span>
          </div>

          <nav className="hidden lg:flex items-center gap-10">
            {[
              { id: 'welcome', label: 'Home' },
              { id: 'dashboard', label: 'My Movies' },
              { id: 'search', label: 'Discover' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => onNavigate(p.id as Page)}
                className={`text-[13px] font-bold uppercase tracking-[0.15em] transition-all hover:text-white ${
                  currentPage === p.id ? 'text-white' : 'text-gray-400'
                }`}
              >
                {p.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-6">
          <button className="text-gray-400 hover:text-white transition-colors">
            <Search size={20} strokeWidth={2.5} />
          </button>
          
          {isAuthenticated ? (
            <button 
              onClick={() => onNavigate('dashboard')}
              className="w-10 h-10 rounded-full border border-gray-700 p-0.5 hover:border-orange-500 transition-all"
            >
              <div className="w-full h-full bg-gray-800 rounded-full flex items-center justify-center">
                <User size={18} className="text-gray-400" />
              </div>
            </button>
          ) : (
            <button
              onClick={onLoginClick}
              className="bg-white text-black px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all shadow-xl"
            >
              Join
            </button>
          )}
        </div>
      </div>
    </header>
  );
};