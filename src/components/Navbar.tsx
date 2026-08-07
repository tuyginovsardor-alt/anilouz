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
    <header className="sticky top-0 z-40 bg-[#0E0E12]/95 backdrop-blur-md border-b border-white/5 px-4 lg:px-6 h-[72px] flex items-center transition-all">
      <div className="flex items-center justify-between gap-4 w-full max-w-[1800px] mx-auto">
        
        {/* Left: Mobile Menu Toggle & Brand Logo (Mobile only) */}
        <div className="flex items-center gap-3">
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group select-none"
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
            <div className="hidden sm:flex flex-col">
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
        <div className="flex items-center gap-1 sm:gap-3">
          {/* Mobile Search Icon */}
          <button
            onClick={onOpenSearch}
            className="md:hidden p-1.5 sm:p-2 text-gray-300 hover:text-orange-400 rounded-full hover:bg-white/5 transition"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Premium Button */}
          <button
            onClick={onOpenPremium}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30 hover:text-amber-300 text-[10px] sm:text-xs font-bold transition shadow-sm"
          >
            <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 fill-amber-400/30" />
            <span className="hidden xs:inline">Premium</span>
            <span className="xs:hidden">VIP</span>
          </button>

          {/* Community Chat Button */}
          <button
            onClick={() => setActiveTab('community')}
            className={`relative p-1.5 sm:p-2 rounded-full transition ${
              activeTab === 'community' ? 'bg-orange-500/20 text-orange-400' : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
            title="Anilo Jamiyat Chat"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-orange-500 animate-pulse" />
          </button>

          {/* Favorites Button */}
          <button
            onClick={() => setActiveTab('favorites')}
            className={`relative p-1.5 sm:p-2 rounded-full transition ${
              activeTab === 'favorites' ? 'bg-orange-500/20 text-orange-400' : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
            title="Sevimliklar"
          >
            <Heart className="w-5 h-5" />
            {favoritesCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[14px] h-[14px] sm:min-w-[18px] sm:h-[18px] px-0.5 sm:px-1 text-[8px] sm:text-[10px] font-bold text-white bg-orange-600 rounded-full border border-[#0E0E12]">
                {favoritesCount}
              </span>
            )}
          </button>

          {/* User Profile Avatar Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 pl-1 border-l border-white/10">
            <button
              onClick={() => setActiveTab('profile')}
              className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border transition ${
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
    </header>
  );
};
