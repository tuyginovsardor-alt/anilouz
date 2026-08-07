import React, { useState } from 'react';
import { Search, Crown, Heart, History, Sparkles, User, Globe, Menu, X, Flame, MessageSquare } from 'lucide-react';
import { ActiveTab, UserProfile } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenSearch: () => void;
  onOpenPremium: () => void;
  favoritesCount: number;
  historyCount: number;
  user: UserProfile;
  currentLang: string;
  onChangeLang: (lang: string) => void;
  onToggleMobileSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSearch,
  onOpenPremium,
  favoritesCount,
  historyCount,
  user,
  currentLang,
  onChangeLang,
  onToggleMobileSidebar,
}) => {
  const [showLangMenu, setShowLangMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#0E0E12]/95 backdrop-blur-md border-b border-white/5 px-4 lg:px-6 pt-3 pb-2 transition-all">
      <div className="flex items-center justify-between gap-4 max-w-[1800px] mx-auto">
        
        {/* Left: Mobile Menu Toggle & Brand Logo (Mobile only) */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden w-10 h-10 rounded-xl bg-[#1c1f26] hover:bg-[#292d38] text-white flex items-center justify-center transition-all hover:-translate-y-0.5 active:scale-95 border border-white/10 shadow-md group"
            aria-label="Menyu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform group-hover:scale-110"
            >
              <path d="M14 16.5H4" />
              <path d="M4 10.5h13.5" />
              <path d="M4 4.5h16.5" />
            </svg>
          </button>

          <div 
            onClick={() => setActiveTab('home')}
            className="lg:hidden flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-orange-500/80 shadow-md bg-[#181820]">
              <img 
                src="https://i.postimg.cc/1XYBLxjY/photo-2026-06-01-00-29-48.jpg" 
                alt="ANILO.UZ Logo" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = '/logo.jpg';
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-white font-sans flex items-center">
                ANILO<span className="text-orange-500 font-extrabold text-xs">.UZ</span>
              </span>
            </div>
          </div>
        </div>

        {/* Center: Search Trigger Input */}
        <div className="flex-1 max-w-xl hidden md:block">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center gap-3 px-4 py-2.5 bg-[#181820] hover:bg-[#20202c] border border-white/10 rounded-full text-gray-400 text-sm transition-all shadow-inner group"
          >
            <Search className="w-4 h-4 text-gray-400 group-hover:text-orange-400 transition-colors" />
            <span className="flex-1 text-left truncate text-gray-400">
              Qidirish... (anime nomi, janr, yili...)
            </span>
            <kbd className="px-2 py-0.5 text-[10px] font-mono bg-white/10 rounded text-gray-300">
              Ctrl + K
            </kbd>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Search Icon */}
          <button
            onClick={onOpenSearch}
            className="md:hidden p-2 text-gray-300 hover:text-orange-400 rounded-full hover:bg-white/5 transition"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Premium Button */}
          <button
            onClick={onOpenPremium}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30 hover:text-amber-300 text-xs font-bold transition shadow-sm"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
            <span>Premium</span>
          </button>

          {/* Community Chat Button */}
          <button
            onClick={() => setActiveTab('community')}
            className={`relative p-2 rounded-full transition ${
              activeTab === 'community' ? 'bg-orange-500/20 text-orange-400' : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
            title="Anilo Jamiyat Chat"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
          </button>

          {/* Favorites Button */}
          <button
            onClick={() => setActiveTab('favorites')}
            className={`relative p-2 rounded-full transition ${
              activeTab === 'favorites' ? 'bg-orange-500/20 text-orange-400' : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
            title="Sevimliklar"
          >
            <Heart className="w-5 h-5" />
            {favoritesCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-orange-600 rounded-full border border-[#0E0E12]">
                {favoritesCount}
              </span>
            )}
          </button>

          {/* User Profile Avatar Button */}
          <div className="flex items-center gap-2 pl-1 border-l border-white/10">
            <button
              onClick={() => setActiveTab('profile')}
              className={`relative w-8 h-8 rounded-full overflow-hidden border transition ${
                activeTab === 'profile'
                  ? 'border-orange-500 ring-2 ring-orange-500/50'
                  : 'border-orange-500/40 hover:ring-2 hover:ring-orange-500/50'
              }`}
              title="Profilim"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </button>
          </div>

        </div>

      </div>

      {/* Mobile Nav Categories Horizontal Strip */}
      <nav className="flex items-center justify-between text-xs font-semibold text-gray-400 overflow-x-auto no-scrollbar gap-5 pt-3 pb-1 border-t border-white/5 mt-2 lg:hidden">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center flex-shrink-0 transition-colors ${
            activeTab === 'home' ? 'text-orange-500 font-bold' : 'hover:text-white'
          }`}
        >
          <span>Bosh sahifa</span>
          {activeTab === 'home' && <div className="h-[2px] w-full bg-orange-500 mt-1 rounded-full" />}
        </button>

        <button 
          onClick={() => setActiveTab('popular')}
          className={`flex flex-col items-center flex-shrink-0 transition-colors ${
            activeTab === 'popular' ? 'text-orange-500 font-bold' : 'hover:text-white'
          }`}
        >
          <span>Anime</span>
          {activeTab === 'popular' && <div className="h-[2px] w-full bg-orange-500 mt-1 rounded-full" />}
        </button>

        <button 
          onClick={() => setActiveTab('series')}
          className={`flex flex-col items-center flex-shrink-0 transition-colors ${
            activeTab === 'series' ? 'text-orange-500 font-bold' : 'hover:text-white'
          }`}
        >
          <span>Seriallar</span>
          {activeTab === 'series' && <div className="h-[2px] w-full bg-orange-500 mt-1 rounded-full" />}
        </button>

        <button 
          onClick={() => setActiveTab('movies')}
          className={`flex flex-col items-center flex-shrink-0 transition-colors ${
            activeTab === 'movies' ? 'text-orange-500 font-bold' : 'hover:text-white'
          }`}
        >
          <span>Filmlar</span>
          {activeTab === 'movies' && <div className="h-[2px] w-full bg-orange-500 mt-1 rounded-full" />}
        </button>

        <button 
          onClick={() => setActiveTab('genres')}
          className={`flex flex-col items-center flex-shrink-0 transition-colors ${
            activeTab === 'genres' ? 'text-orange-500 font-bold' : 'hover:text-white'
          }`}
        >
          <span>Janrlar</span>
          {activeTab === 'genres' && <div className="h-[2px] w-full bg-orange-500 mt-1 rounded-full" />}
        </button>
      </nav>
    </header>
  );
};
