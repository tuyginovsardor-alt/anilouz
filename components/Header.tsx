
import React from 'react';
import { Page } from '../App';
import { UzumakiLogo } from './icons/UzumakiLogo';
import { Bot } from 'lucide-react';

interface HeaderProps {
  onNavigate: (page: Page) => void;
  currentPage: Page;
  isAuthenticated: boolean;
  onLoginClick: () => void;
}

const NavLink: React.FC<{
  onClick: () => void;
  isActive: boolean;
  children: React.ReactNode;
}> = ({ onClick, isActive, children }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors flex items-center gap-2 ${
      isActive
        ? 'text-orange-400'
        : 'text-gray-400 hover:text-white'
    }`}
  >
    {children}
  </button>
);

export const Header: React.FC<HeaderProps> = ({
  onNavigate,
  currentPage,
  isAuthenticated,
  onLoginClick,
}) => {
  const handleLogoClick = () => {
    onNavigate('welcome');
  };

  return (
    <header className="py-4 sticky top-0 z-20 bg-black/30 backdrop-blur-md border-b border-white/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={handleLogoClick}
        >
          {/* Logotip Chapda - O'lcham kattalashtirildi */}
          <div className="relative">
             <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
             <UzumakiLogo className="w-12 h-12 sm:w-14 sm:h-14 transition-transform duration-700 group-hover:rotate-[360deg]" />
          </div>
          
          {/* Domain Nomi O'ngda */}
          <h1 className="font-bold font-['Metal_Mania'] tracking-wider text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 bg-clip-text text-transparent animate-pulsate-glow">
                Anilo.uz
            </span>
          </h1>
        </div>
        
        <nav className="flex items-center gap-1 sm:gap-2">
          <NavLink onClick={() => onNavigate('ai-assistant')} isActive={currentPage === 'ai-assistant'}>
            <Bot size={18} />
            <span className="hidden sm:inline">AI Yordamchi</span>
          </NavLink>
          {isAuthenticated && (
            <NavLink onClick={() => onNavigate('dashboard')} isActive={currentPage === 'dashboard'}>
              Boshqaruv
            </NavLink>
          )}
          {!isAuthenticated ? (
            <button
              onClick={onLoginClick}
              className="ml-2 px-4 py-2 text-sm font-semibold bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
            >
              Kirish
            </button>
          ) : null}
        </nav>
      </div>
    </header>
  );
};
