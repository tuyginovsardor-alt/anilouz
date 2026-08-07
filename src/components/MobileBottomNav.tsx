import React from 'react';
import { Home, Tv, Clapperboard, Film, User } from 'lucide-react';
import { ActiveTab } from '../types';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenSearch: () => void;
  onOpenPremium: () => void;
  favoritesCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenSearch,
  onOpenPremium,
  favoritesCount,
}) => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[150] bg-[#0E0E12]/98 backdrop-blur-2xl border-t border-white/10 px-2 pb-2 sm:pb-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      <nav className="flex items-center justify-around h-16 max-w-lg mx-auto relative">
        
        {/* Home */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'home' ? 'text-orange-500' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Home className={`w-6 h-6 ${activeTab === 'home' ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-bold">Bosh sahifa</span>
        </button>

        {/* Anime (Popular) */}
        <button
          onClick={() => setActiveTab('popular')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'popular' ? 'text-orange-500' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Tv className={`w-6 h-6 ${activeTab === 'popular' ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-bold">Anime</span>
        </button>

        {/* Series */}
        <button
          onClick={() => setActiveTab('series')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'series' ? 'text-orange-500' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Clapperboard className={`w-6 h-6 ${activeTab === 'series' ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-bold">Seriallar</span>
        </button>

        {/* Movies */}
        <button
          onClick={() => setActiveTab('movies')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'movies' ? 'text-orange-500' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Film className={`w-6 h-6 ${activeTab === 'movies' ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-bold">Filmlar</span>
        </button>

        {/* Profile */}
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'profile' ? 'text-orange-500' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <User className={`w-6 h-6 ${activeTab === 'profile' ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-bold">Profil</span>
        </button>

      </nav>
    </div>
  );
};
